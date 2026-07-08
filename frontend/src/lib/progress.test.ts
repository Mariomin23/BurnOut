import { describe, it, expect } from 'vitest';
import type { WorkoutLog, ExerciseSetLog } from '../types';
import { listTrackedExercises, buildProgressSeries, workoutMuscles } from './progress';

const set = (weightKg: number, reps: number, rpe = 8): ExerciseSetLog => ({ weightKg, reps, rpe });

const workout = (
  id: string,
  date: string,
  exercises: Array<{ exerciseId: string; exerciseName: string; targetMuscle: string; sets: ExerciseSetLog[] }>
): WorkoutLog => ({
  id,
  date,
  split: 'Tren Superior',
  goal: 'Volumen',
  totalVolumeKg: 0,
  exercises,
});

const banca = (sets: ExerciseSetLog[]) => ({
  exerciseId: 'ex-101', exerciseName: 'Press de Banca con Barra', targetMuscle: 'Pecho', sets,
});
const flexiones = (sets: ExerciseSetLog[]) => ({
  exerciseId: 'ex-130', exerciseName: 'Flexiones de Pecho', targetMuscle: 'Pecho', sets,
});
const remo = (sets: ExerciseSetLog[]) => ({
  exerciseId: 'ex-105', exerciseName: 'Remo con Barra', targetMuscle: 'Espalda', sets,
});

describe('listTrackedExercises', () => {
  it('ordena por número de sesiones descendente', () => {
    const history = [
      workout('w1', '2026-07-01T10:00:00Z', [banca([set(40, 10)]), remo([set(50, 8)])]),
      workout('w2', '2026-07-03T10:00:00Z', [banca([set(42.5, 10)])]),
    ];
    const tracked = listTrackedExercises(history);
    expect(tracked[0]).toEqual({ exerciseId: 'ex-101', exerciseName: 'Press de Banca con Barra', sessions: 2 });
    expect(tracked[1].exerciseId).toBe('ex-105');
  });

  it('a igualdad de sesiones gana el entrenado más recientemente', () => {
    const history = [
      workout('w1', '2026-07-01T10:00:00Z', [remo([set(50, 8)])]),
      workout('w2', '2026-07-03T10:00:00Z', [banca([set(40, 10)])]),
    ];
    const tracked = listTrackedExercises(history);
    expect(tracked.map(t => t.exerciseId)).toEqual(['ex-101', 'ex-105']);
  });

  it('devuelve vacío sin historial', () => {
    expect(listTrackedExercises([])).toEqual([]);
  });
});

describe('buildProgressSeries', () => {
  it('devuelve un punto por sesión, ascendente por fecha, con top set y volumen', () => {
    const history = [
      workout('w2', '2026-07-03T10:00:00Z', [banca([set(42.5, 8), set(42.5, 10)])]),
      workout('w1', '2026-07-01T10:00:00Z', [banca([set(40, 10), set(37.5, 12)])]),
    ];
    const series = buildProgressSeries(history, 'ex-101');
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({
      date: '2026-07-01T10:00:00Z', topWeightKg: 40, topReps: 10, totalVolumeKg: 40 * 10 + 37.5 * 12,
    });
    // A igual peso, el top set es el de más reps
    expect(series[1].topWeightKg).toBe(42.5);
    expect(series[1].topReps).toBe(10);
  });

  it('en ejercicios de autocarga (0 kg) usa las reps máximas como top set', () => {
    const history = [
      workout('w1', '2026-07-01T10:00:00Z', [flexiones([set(0, 12), set(0, 15), set(0, 10)])]),
    ];
    const series = buildProgressSeries(history, 'ex-130');
    expect(series[0].topWeightKg).toBe(0);
    expect(series[0].topReps).toBe(15);
    expect(series[0].totalVolumeKg).toBe(0);
  });

  it('ignora sesiones donde el ejercicio no aparece', () => {
    const history = [
      workout('w1', '2026-07-01T10:00:00Z', [remo([set(50, 8)])]),
      workout('w2', '2026-07-03T10:00:00Z', [banca([set(40, 10)])]),
    ];
    expect(buildProgressSeries(history, 'ex-101')).toHaveLength(1);
    expect(buildProgressSeries(history, 'no-existe')).toEqual([]);
  });
});

describe('workoutMuscles', () => {
  it('devuelve músculos únicos en orden de aparición', () => {
    const log = workout('w1', '2026-07-01T10:00:00Z', [
      banca([set(40, 10)]),
      flexiones([set(0, 15)]),
      remo([set(50, 8)]),
    ]);
    expect(workoutMuscles(log)).toEqual(['Pecho', 'Espalda']);
  });
});
