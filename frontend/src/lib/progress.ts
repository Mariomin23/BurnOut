import type { WorkoutLog } from '../types';

export interface TrackedExercise {
  exerciseId: string;
  exerciseName: string;
  sessions: number;
}

export interface ProgressPoint {
  date: string;
  /** Peso del top set de la sesión (0 si todo fue autocarga) */
  topWeightKg: number;
  /** Reps del top set (o las reps máximas de la sesión si todo fue a 0 kg) */
  topReps: number;
  /** Volumen (kg x reps) de este ejercicio en la sesión */
  totalVolumeKg: number;
}

/**
 * Ejercicios con al menos una sesión registrada, ordenados por número de
 * sesiones descendente; a igualdad, el entrenado más recientemente primero.
 */
export function listTrackedExercises(history: WorkoutLog[]): TrackedExercise[] {
  const byId = new Map<string, TrackedExercise & { lastIndex: number }>();

  history.forEach((workout, index) => {
    for (const exercise of workout.exercises) {
      const entry = byId.get(exercise.exerciseId);
      if (entry) {
        entry.sessions++;
        entry.lastIndex = index;
        entry.exerciseName = exercise.exerciseName;
      } else {
        byId.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          sessions: 1,
          lastIndex: index,
        });
      }
    }
  });

  return [...byId.values()]
    .sort((a, b) => b.sessions - a.sessions || b.lastIndex - a.lastIndex)
    .map(({ exerciseId, exerciseName, sessions }) => ({ exerciseId, exerciseName, sessions }));
}

/**
 * Serie de progreso de un ejercicio, ascendente por fecha.
 * Una entrada por sesión del historial en la que aparece el ejercicio.
 */
export function buildProgressSeries(history: WorkoutLog[], exerciseId: string): ProgressPoint[] {
  const points: ProgressPoint[] = [];

  for (const workout of history) {
    const exercise = workout.exercises.find(e => e.exerciseId === exerciseId);
    if (!exercise || exercise.sets.length === 0) continue;

    let topWeightKg = 0;
    let topReps = 0;
    let totalVolumeKg = 0;
    for (const set of exercise.sets) {
      totalVolumeKg += set.weightKg * set.reps;
      if (set.weightKg > topWeightKg || (set.weightKg === topWeightKg && set.reps > topReps)) {
        topWeightKg = set.weightKg;
        topReps = set.reps;
      }
    }

    points.push({ date: workout.date, topWeightKg, topReps, totalVolumeKg });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/** Grupos musculares únicos de un entrenamiento, en orden de aparición. */
export function workoutMuscles(log: WorkoutLog): string[] {
  const muscles: string[] = [];
  for (const exercise of log.exercises) {
    if (!muscles.includes(exercise.targetMuscle)) {
      muscles.push(exercise.targetMuscle);
    }
  }
  return muscles;
}
