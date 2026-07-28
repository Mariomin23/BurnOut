import { Request, Response } from 'express';
import { RoutineService } from '../services/routineService';
import { IExerciseRepository } from '../repositories/exerciseRepository';
import { UserModel } from '../models/user.model';
import { Exercise } from '../types';
import { UserProfileSchema, RerollRequestSchema, HistorySchema } from '../schemas/userProfile.schema';

/** Mínimo de favoritos para que una rutina personalizada tenga sentido */
export const MIN_FAVORITES_FOR_ROUTINE = 5;

export class RoutineController {
  constructor(
    private routineService: RoutineService,
    private exerciseRepository: IExerciseRepository
  ) {}

  /** history inválido se ignora (nunca 400): los datos viejos del móvil no deben romper la generación */
  private parseHistory(raw: unknown) {
    if (raw === undefined) return [];
    const parsed = HistorySchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('Invalid history payload ignored');
      return [];
    }
    return parsed.data;
  }

  public generate = async (req: Request, res: Response): Promise<void> => {
    const result = UserProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Datos del perfil inválidos', details: result.error.format() });
      return;
    }
    try {
      const history = this.parseHistory(req.body.history);
      const routine = await this.routineService.generateRoutine(result.data, history);
      res.json(routine);
    } catch (error) {
      console.error('Error generating routine:', error);
      res.status(500).json({ error: 'Error interno al generar la rutina' });
    }
  };

  /** POST /api/routines/from-favorites — requiere sesión y 5+ favoritos guardados */
  public generateFromFavorites = async (req: Request, res: Response): Promise<void> => {
    const result = UserProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Datos del perfil inválidos', details: result.error.format() });
      return;
    }
    try {
      const user = await UserModel.findById(req.userId).select('favorites');
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      if (user.favorites.length < MIN_FAVORITES_FOR_ROUTINE) {
        res.status(400).json({
          error: `Necesitas al menos ${MIN_FAVORITES_FOR_ROUTINE} ejercicios favoritos para generar una rutina personalizada`,
          favoritesCount: user.favorites.length,
          required: MIN_FAVORITES_FOR_ROUTINE,
        });
        return;
      }

      const found = await Promise.all(user.favorites.map(id => this.exerciseRepository.getById(id)));
      const favorites = found.filter((ex): ex is Exercise => ex !== null);
      if (favorites.length < MIN_FAVORITES_FOR_ROUTINE) {
        res.status(400).json({
          error: 'Algunos favoritos ya no están disponibles en el catálogo. Añade más ejercicios.',
          favoritesCount: favorites.length,
          required: MIN_FAVORITES_FOR_ROUTINE,
        });
        return;
      }

      const history = this.parseHistory(req.body.history);
      const routine = await this.routineService.generateFromFavorites(favorites, result.data, history);
      res.json(routine);
    } catch (error) {
      console.error('Error generating routine from favorites:', error);
      res.status(500).json({ error: 'Error interno al generar la rutina de favoritos' });
    }
  };

  public reroll = async (req: Request, res: Response): Promise<void> => {
    const result = RerollRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Parámetros de re-roll inválidos', details: result.error.format() });
      return;
    }
    try {
      const { targetMuscle, excludedIds, profile } = result.data;
      const history = this.parseHistory(req.body.history);
      const workoutExercise = await this.routineService.rerollExercise(targetMuscle, excludedIds, profile, history);
      res.json(workoutExercise);
    } catch (error) {
      console.error('Error in re-roll:', error);
      res.status(500).json({ error: 'Error interno al hacer re-roll del ejercicio' });
    }
  };
}
