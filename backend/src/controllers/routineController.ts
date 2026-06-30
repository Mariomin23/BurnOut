import { Request, Response } from 'express';
import { RoutineService } from '../services/routineService';
import { UserProfileSchema, RerollRequestSchema } from '../schemas/userProfile.schema';

export class RoutineController {
  constructor(private routineService: RoutineService) {}

  public generate = async (req: Request, res: Response): Promise<void> => {
    const result = UserProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Datos del perfil inválidos', details: result.error.format() });
      return;
    }
    try {
      const routine = await this.routineService.generateRoutine(result.data);
      res.json(routine);
    } catch (error) {
      console.error('Error generating routine:', error);
      res.status(500).json({ error: 'Error interno al generar la rutina' });
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
      const workoutExercise = await this.routineService.rerollExercise(targetMuscle, excludedIds, profile);
      res.json(workoutExercise);
    } catch (error) {
      console.error('Error in re-roll:', error);
      res.status(500).json({ error: 'Error interno al hacer re-roll del ejercicio' });
    }
  };
}
