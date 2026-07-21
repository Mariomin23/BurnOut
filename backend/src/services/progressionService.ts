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
    lastSession: ExerciseHistorySummary['lastSession'] | undefined,
    fallbackWeightKg?: number
  ): Prescription {
    const range = GOAL_REP_RANGE[goal];
    const loadFactor = exercise.weight_factor ?? 1;

    if (!lastSession || lastSession.sets.length === 0) {
      return { suggestedWeightKg: loadFactor === 0 ? 0 : (fallbackWeightKg ?? 0), suggestedReps: range.min };
    }

    const bestReps = Math.max(...lastSession.sets.map(s => s.reps));

    if (loadFactor === 0) {
      return {
        suggestedWeightKg: 0,
        suggestedReps: Math.min(bestReps + 1, range.max),
        direction: 'keep',
      };
    }

    const refWeight = Math.max(...lastSession.sets.map(s => s.weightKg));

    if (lastSession.goal !== goal) {
      return { suggestedWeightKg: this.round(refWeight), suggestedReps: range.min, direction: 'keep' };
    }

    const increment = loadFactor >= 1.2 ? 5 : 2.5;
    const avgRpe = lastSession.sets.reduce((sum, s) => sum + s.rpe, 0) / lastSession.sets.length;
    const allAtTop = lastSession.sets.every(s => s.reps >= range.max);
    const anyBelowMin = lastSession.sets.some(s => s.reps < range.min);

    if (allAtTop && avgRpe <= 8) {
      return { suggestedWeightKg: this.round(refWeight + increment), suggestedReps: range.min, direction: 'up' };
    }
    if (anyBelowMin || avgRpe >= 9.5) {
      return { suggestedWeightKg: this.round(refWeight - 2.5), suggestedReps: range.min, direction: 'down' };
    }
    return {
      suggestedWeightKg: this.round(refWeight),
      suggestedReps: Math.min(bestReps + 1, range.max),
      direction: 'keep',
    };
  }

  private round(weightKg: number): number {
    return Math.max(Math.round(weightKg / 2.5) * 2.5, 2.5);
  }
}
