import { describe, it, expect } from 'vitest';
import { ProgressionService, GOAL_REP_RANGE } from './progressionService';
import { Exercise, ExerciseSetLog } from '../types';

const svc = new ProgressionService();

const barbell: Exercise = {
  id: 'ex-1', name: 'Press de Banca con Barra', target_muscle: 'Pecho',
  split_category: 'tren_superior', difficulty: 'intermediate',
  description: '', weight_factor: 1.0,
};
const heavy: Exercise = { ...barbell, id: 'ex-2', name: 'Prensa de Piernas 45°', weight_factor: 1.8 };
const bodyweight: Exercise = { ...barbell, id: 'ex-3', name: 'Dominadas Pronas', weight_factor: 0 };

const sets = (entries: Array<[number, number, number]>): ExerciseSetLog[] =>
  entries.map(([weightKg, reps, rpe]) => ({ weightKg, reps, rpe }));

const session = (goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo', s: ExerciseSetLog[]) =>
  ({ date: '2026-07-01T10:00:00.000Z', goal, sets: s });

describe('GOAL_REP_RANGE', () => {
  it('define los rangos del spec', () => {
    expect(GOAL_REP_RANGE['Perder Peso']).toEqual({ min: 12, max: 15 });
    expect(GOAL_REP_RANGE['Volumen']).toEqual({ min: 8, max: 12 });
    expect(GOAL_REP_RANGE['Mantenerse Activo']).toEqual({ min: 10, max: 12 });
  });
});

describe('prescribe — fallback', () => {
  it('sin historial usa el peso fallback y el mínimo del rango, sin dirección', () => {
    const p = svc.prescribe(barbell, 'Volumen', undefined, 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 8 });
  });

  it('sesión sin series completadas equivale a sin historial', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', []), 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 8 });
  });
});

describe('prescribe — autocarga (weight_factor 0)', () => {
  it('progresa +1 rep sobre la mejor marca', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 10, 8], [0, 8, 9]])), 0);
    expect(p).toEqual({ suggestedWeightKg: 0, suggestedReps: 11, direction: 'keep' });
  });

  it('capa las reps al tope del rango', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 12, 8]])), 0);
    expect(p.suggestedReps).toBe(12);
  });
});

describe('prescribe — subir peso', () => {
  it('todas las series al tope con RPE medio ≤ 8 → +2.5kg y reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 12, 8], [40, 12, 7]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 42.5, suggestedReps: 8, direction: 'up' });
  });

  it('weight_factor ≥ 1.2 sube 5kg', () => {
    const p = svc.prescribe(heavy, 'Volumen', session('Volumen', sets([[100, 12, 7], [100, 12, 7]])), 100);
    expect(p.suggestedWeightKg).toBe(105);
    expect(p.direction).toBe('up');
  });

  it('redondea a múltiplos de 2.5 tras el incremento', () => {
    // ref 41 + 2.5 = 43.5 → 42.5
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[41, 12, 7]])), 40);
    expect(p.suggestedWeightKg).toBe(42.5);
  });

  it('no sube si el RPE medio supera 8 aunque llegue al tope', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 9], [40, 12, 9]])), 40);
    expect(p.direction).not.toBe('up');
  });
});

describe('prescribe — bajar peso', () => {
  it('alguna serie bajo el mínimo del rango → −2.5kg, reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 6, 9]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 37.5, suggestedReps: 8, direction: 'down' });
  });

  it('RPE medio ≥ 9.5 → baja aunque las reps estén en rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 10], [40, 9, 9]])), 40);
    expect(p.direction).toBe('down');
  });

  it('suelo de 2.5kg', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[2.5, 6, 10]])), 2.5);
    expect(p.suggestedWeightKg).toBe(2.5);
  });
});

describe('prescribe — mantener', () => {
  it('dentro del rango → mismo peso y mejor marca + 1', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 9, 8]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 11, direction: 'keep' });
  });

  it('capa la sugerencia de reps al tope del rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 9, 8]])), 40);
    expect(p.suggestedReps).toBe(12);
  });
});

describe('prescribe — cambio de objetivo', () => {
  it('conserva el peso de referencia y resetea reps al rango nuevo', () => {
    const p = svc.prescribe(barbell, 'Perder Peso', session('Volumen', sets([[40, 12, 7], [40, 12, 7]])), 30);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 12, direction: 'keep' });
  });
});
