import { Request, Response } from 'express';
import { RoutineService } from '../services/routineService';
import { UserProfile } from '../types';

export class RoutineController {
  constructor(private routineService: RoutineService) {}

  public generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { weightKg, heightCm, age, sex, experience, split, goal } = req.body;

      // Basic validations
      if (!weightKg || !experience || !split || !goal) {
        res.status(400).json({ error: 'Faltan parámetros obligatorios en la solicitud (pesoKg, experiencia, split, objetivo)' });
        return;
      }

      const profile: UserProfile = {
        weightKg: Number(weightKg),
        heightCm: heightCm ? Number(heightCm) : 170,
        age: age ? Number(age) : 25,
        sex: sex || 'otro',
        experience,
        split,
        goal
      };

      const routine = await this.routineService.generateRoutine(profile);
      res.json(routine);
    } catch (error) {
      console.error('Error generating routine:', error);
      res.status(500).json({ error: 'Error interno al generar la rutina' });
    }
  };

  public reroll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { targetMuscle, excludedIds, profile } = req.body;

      if (!targetMuscle || !Array.isArray(excludedIds) || !profile) {
        res.status(400).json({ error: 'Faltan parámetros obligatorios para el re-roll (targetMuscle, excludedIds, profile)' });
        return;
      }

      const workoutExercise = await this.routineService.rerollExercise(
        targetMuscle,
        excludedIds,
        profile
      );

      res.json(workoutExercise);
    } catch (error) {
      console.error('Error in re-roll:', error);
      res.status(500).json({ error: 'Error interno al hacer re-roll del ejercicio' });
    }
  };
}
