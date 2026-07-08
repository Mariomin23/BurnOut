import type {
  ExerciseHistorySummary,
  ExerciseLog,
  WorkoutLog,
  WorkoutRoutine,
} from '../types';

export const HISTORY_KEY = 'fit_poke_history_v1';
export const MAX_WORKOUTS = 100;
export const MAX_SUMMARY_EXERCISES = 30;

export function buildWorkoutLog(routine: WorkoutRoutine, date: string): WorkoutLog | null {
  const exercises: ExerciseLog[] = routine.exercises
    .map(item => ({
      exerciseId: item.exercise.id,
      exerciseName: item.exercise.name,
      targetMuscle: item.exercise.target_muscle,
      sets: item.sets
        .filter(s => s.completed)
        .map(s => ({
          weightKg: s.completedWeightKg ?? 0,
          reps: s.completedReps ?? 0,
          rpe: s.completedRpe ?? 8,
        })),
    }))
    .filter(e => e.sets.length > 0);

  if (exercises.length === 0) return null;

  const totalVolumeKg = exercises.reduce(
    (total, e) => total + e.sets.reduce((sub, s) => sub + s.weightKg * s.reps, 0),
    0
  );

  return {
    id: routine.id,
    date,
    split: routine.split,
    goal: routine.goal,
    totalVolumeKg,
    exercises,
  };
}

export function appendToHistory(
  history: WorkoutLog[],
  log: WorkoutLog,
  max: number = MAX_WORKOUTS
): WorkoutLog[] {
  return [...history, log].slice(-max);
}

/**
 * Fusiona historial local y remoto: dedup por id (gana la primera aparición,
 * local primero), orden ascendente por fecha, cap al máximo.
 */
export function mergeHistories(
  local: WorkoutLog[],
  remote: WorkoutLog[],
  max: number = MAX_WORKOUTS
): WorkoutLog[] {
  const byId = new Map<string, WorkoutLog>();
  for (const log of [...local, ...remote]) {
    if (!byId.has(log.id)) byId.set(log.id, log);
  }
  return [...byId.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-max);
}

export function summarizeHistory(
  history: WorkoutLog[],
  maxExercises: number = MAX_SUMMARY_EXERCISES
): ExerciseHistorySummary[] {
  const byExercise = new Map<string, ExerciseHistorySummary>();
  // Del más reciente al más antiguo: la primera aparición gana
  for (let i = history.length - 1; i >= 0 && byExercise.size < maxExercises; i--) {
    const workout = history[i];
    for (const exercise of workout.exercises) {
      if (byExercise.size >= maxExercises) break;
      if (byExercise.has(exercise.exerciseId)) continue;
      byExercise.set(exercise.exerciseId, {
        exerciseId: exercise.exerciseId,
        lastSession: { date: workout.date, goal: workout.goal, sets: exercise.sets },
      });
    }
  }
  return [...byExercise.values()];
}
