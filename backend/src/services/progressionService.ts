import { Exercise, ExerciseHistorySummary, GoalLabel, ProgressionDirection } from '../types';

export const GOAL_REP_RANGE: Record<GoalLabel, { min: number; max: number }> = {
  'Perder Peso': { min: 12, max: 15 },
  'Volumen': { min: 8, max: 12 },
  'Mantenerse Activo': { min: 10, max: 12 },
};

export interface Prescription {
  suggestedWeightKg: number;
  suggestedReps: number;
  direction?: ProgressionDirection;
}

export class ProgressionService {
  public prescribe(
    exercise: Exercise,
    goal: GoalLabel,
    lastSession: ExerciseHistorySummary['lastSession'] | undefined
  ): Prescription {
    const range = GOAL_REP_RANGE[goal];
    const loadFactor = exercise.weight_factor ?? 1;

    if (!lastSession || lastSession.sets.length === 0) {
      // Bodyweight exercises: give rep target even first time
      if (loadFactor === 0) {
        return { suggestedWeightKg: 0, suggestedReps: range.min };
      }
      // Gym exercise, first time ever: no suggestion, user fills in
      return { suggestedWeightKg: 0, suggestedReps: 0 };
    }

    const bestReps = Math.max(...lastSession.sets.map(s => s.reps));

    if (loadFactor === 0) {
      const nextReps = bestReps >= range.max ? bestReps + 1 : bestReps;
      return {
        suggestedWeightKg: 0,
        suggestedReps: nextReps,
        direction: bestReps >= range.max ? 'up' : 'keep',
      };
    }

    // Gym exercise with history: show exact last values + progression badge
    const refWeight = Math.max(...lastSession.sets.map(s => s.weightKg));

    let direction: ProgressionDirection = 'keep';
    if (lastSession.goal === goal) {
      const increment = loadFactor >= 1.2 ? 5 : 2.5;
      const avgRpe = lastSession.sets.reduce((sum, s) => sum + s.rpe, 0) / lastSession.sets.length;
      const allAtTop = lastSession.sets.every(s => s.reps >= range.max);
      const anyBelowMin = lastSession.sets.some(s => s.reps < range.min);

      if (allAtTop && avgRpe <= 8) direction = 'up';
      else if (anyBelowMin || avgRpe >= 9.5) direction = 'down';
      // unused increment kept for future use
      void increment;
    }

    return {
      suggestedWeightKg: this.round(refWeight),
      suggestedReps: bestReps,
      direction,
    };
  }

  private round(weightKg: number): number {
    return Math.max(Math.round(weightKg / 2.5) * 2.5, 2.5);
  }
}
