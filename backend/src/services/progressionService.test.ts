import { describe, it, expect } from 'vitest';
import {
  ProgressionService,
  GOAL_REP_RANGE,
  LifterProfile,
  estimateOneRepMaxKg,
  estimateOneRepMaxFromSets,
  hardBodyweightReps,
} from './progressionService';
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

const lifter: LifterProfile = { weightKg: 80, age: 30, experience: 'intermediate', sex: 'masculino' };
const squat: Exercise = { ...barbell, id: 'ex-4', name: 'barbell full squat', target_muscle: 'Glúteos', weight_factor: 1.2 };
const curl: Exercise = { ...barbell, id: 'ex-5', name: 'barbell curl', target_muscle: 'Bíceps', weight_factor: 0.4 };
const row: Exercise = { ...barbell, id: 'ex-6', name: 'cable seated row', target_muscle: 'Espalda', weight_factor: 0.8 };
const pullUp: Exercise = { ...barbell, id: 'ex-7', name: 'pull-up', target_muscle: 'Espalda', weight_factor: 0 };

describe('estimateOneRepMaxKg — carga base por peso corporal', () => {
  it('sentadilla/peso muerto ×1.5, press banca ×1.0, aislamiento ×0.25', () => {
    expect(estimateOneRepMaxKg(squat, lifter)).toBe(120);
    expect(estimateOneRepMaxKg(barbell, lifter)).toBe(80);
    expect(estimateOneRepMaxKg(curl, lifter)).toBe(20);
  });

  it('aplica los modificadores de edad', () => {
    expect(estimateOneRepMaxKg(barbell, { ...lifter, age: 35 })).toBe(80);
    expect(estimateOneRepMaxKg(barbell, { ...lifter, age: 36 })).toBeCloseTo(72);
    expect(estimateOneRepMaxKg(barbell, { ...lifter, age: 50 })).toBeCloseTo(72);
    expect(estimateOneRepMaxKg(barbell, { ...lifter, age: 51 })).toBeCloseTo(64);
  });

  it('aplica los modificadores de nivel', () => {
    expect(estimateOneRepMaxKg(barbell, { ...lifter, experience: 'beginner' })).toBeCloseTo(56);
    expect(estimateOneRepMaxKg(barbell, { ...lifter, experience: 'advanced' })).toBeCloseTo(104);
  });

  it('con mancuernas reparte la carga entre las dos manos', () => {
    const dbBench: Exercise = { ...barbell, name: 'dumbbell bench press' };
    expect(estimateOneRepMaxKg(dbBench, lifter)).toBe(40);
  });

  it('en mujeres reduce más el tren superior que el inferior', () => {
    const woman: LifterProfile = { ...lifter, sex: 'femenino' };
    expect(estimateOneRepMaxKg(squat, woman)).toBeCloseTo(90);
    expect(estimateOneRepMaxKg(barbell, woman)).toBeCloseTo(48);
    expect(estimateOneRepMaxKg(curl, woman)).toBeCloseTo(12);
  });

  it('devuelve null si la tabla no cubre el ejercicio', () => {
    expect(estimateOneRepMaxKg(row, lifter)).toBeNull();
    expect(estimateOneRepMaxKg(pullUp, lifter)).toBeNull();
    expect(estimateOneRepMaxKg({ ...barbell, name: 'medicine ball chest press' }, lifter)).toBeNull();
  });
});

describe('prescribe — primera sesión', () => {
  it('hipertrofia: 70% del 1RM ajustado, redondeado hacia abajo a 2.5 kg, RPE 8', () => {
    expect(svc.prescribe(barbell, 'Volumen', undefined, lifter))
      .toEqual({ suggestedWeightKg: 55, suggestedReps: 8, targetRpe: 8 });
    expect(svc.prescribe(squat, 'Volumen', undefined, lifter))
      .toEqual({ suggestedWeightKg: 82.5, suggestedReps: 8, targetRpe: 8 });
  });

  it('rango 12-15 reps usa el 65%', () => {
    expect(svc.prescribe(barbell, 'Perder Peso', undefined, lifter))
      .toEqual({ suggestedWeightKg: 50, suggestedReps: 12, targetRpe: 8 });
  });

  it('suelo de 2.5 kg en cargas muy bajas', () => {
    const light: LifterProfile = { weightKg: 45, age: 60, experience: 'beginner', sex: 'masculino' };
    expect(svc.prescribe(curl, 'Volumen', undefined, light).suggestedWeightKg).toBe(2.5);
  });

  it('ejercicio fuera de la tabla o sin perfil: en blanco y mínimo del rango', () => {
    expect(svc.prescribe(row, 'Volumen', undefined, lifter)).toEqual({ suggestedWeightKg: 0, suggestedReps: 8 });
    expect(svc.prescribe(barbell, 'Volumen', undefined)).toEqual({ suggestedWeightKg: 0, suggestedReps: 8 });
  });

  it('sesión sin series completadas equivale a sin historial', () => {
    expect(svc.prescribe(barbell, 'Volumen', session('Volumen', []), lifter))
      .toEqual({ suggestedWeightKg: 55, suggestedReps: 8, targetRpe: 8 });
  });

  it('con historial manda la progresión, no la tabla', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 9, 8]])), lifter);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 11, direction: 'keep' });
  });
});

describe('regla especial de autocargas', () => {
  it('no aplica a un usuario ligero, joven y con experiencia', () => {
    expect(hardBodyweightReps(pullUp, lifter)).toBeNull();
    expect(svc.prescribe(pullUp, 'Volumen', undefined, lifter)).toEqual({ suggestedWeightKg: 0, suggestedReps: 8 });
  });

  it('más de 85 kg, principiante o más de 40 años → 3-5 reps a RPE 9', () => {
    expect(svc.prescribe(pullUp, 'Volumen', undefined, { ...lifter, weightKg: 86 }))
      .toEqual({ suggestedWeightKg: 0, suggestedReps: 5, targetRpe: 9 });
    expect(hardBodyweightReps(pullUp, { ...lifter, experience: 'beginner' })).toBe(5);
    expect(hardBodyweightReps(pullUp, { ...lifter, age: 41 })).toBe(5);
    expect(hardBodyweightReps(pullUp, { ...lifter, age: 40 })).toBeNull();
  });

  it('cuantas más condiciones, menos reps (mínimo 3)', () => {
    expect(hardBodyweightReps(pullUp, { ...lifter, weightKg: 90, experience: 'beginner' })).toBe(4);
    expect(hardBodyweightReps(pullUp, { ...lifter, weightKg: 90, age: 45, experience: 'beginner' })).toBe(3);
  });

  it('no afecta a autocargas ligeras ni a variantes asistidas', () => {
    const heavyUser: LifterProfile = { weightKg: 95, age: 45, experience: 'beginner', sex: 'masculino' };
    expect(hardBodyweightReps({ ...pullUp, name: 'push-up' }, heavyUser)).toBeNull();
    expect(hardBodyweightReps({ ...pullUp, name: 'band assisted pull-up' }, heavyUser)).toBeNull();
    expect(hardBodyweightReps({ ...pullUp, name: 'bench dip (knees bent)' }, heavyUser)).toBeNull();
    expect(hardBodyweightReps({ ...pullUp, name: 'lever seated crunch' }, heavyUser)).toBeNull();
  });

  it('con historial progresa de rep en rep desde su marca, manteniendo RPE 9 bajo el rango', () => {
    const p = svc.prescribe(pullUp, 'Volumen', session('Volumen', sets([[0, 4, 9], [0, 3, 9]])), { ...lifter, weightKg: 90 });
    expect(p).toEqual({ suggestedWeightKg: 0, suggestedReps: 5, direction: 'keep', targetRpe: 9 });
  });
});

describe('prescribe — autocarga (weight_factor 0)', () => {
  it('progresa +1 rep sobre la mejor marca', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 10, 8], [0, 8, 9]])));
    expect(p).toEqual({ suggestedWeightKg: 0, suggestedReps: 11, direction: 'keep' });
  });

  it('capa las reps al tope del rango', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 12, 8]])));
    expect(p.suggestedReps).toBe(12);
  });

  it('con cambio de objetivo sigue en autocarga: mejor marca + 1 capada al rango nuevo', () => {
    // La regla de autocarga se evalúa antes que el cambio de objetivo (orden del spec)
    const p = svc.prescribe(bodyweight, 'Perder Peso', session('Volumen', sets([[0, 14, 8]])));
    expect(p).toEqual({ suggestedWeightKg: 0, suggestedReps: 15, direction: 'keep' });
  });
});

describe('prescribe — subir peso', () => {
  it('todas las series al tope con RPE medio ≤ 8 → +2.5kg y reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 12, 8], [40, 12, 7]])));
    expect(p).toEqual({ suggestedWeightKg: 42.5, suggestedReps: 8, direction: 'up' });
  });

  it('weight_factor ≥ 1.2 sube 5kg', () => {
    const p = svc.prescribe(heavy, 'Volumen', session('Volumen', sets([[100, 12, 7], [100, 12, 7]])));
    expect(p.suggestedWeightKg).toBe(105);
    expect(p.direction).toBe('up');
  });

  it('redondea a múltiplos de 2.5 tras el incremento', () => {
    // ref 41 + 2.5 = 43.5 → 42.5
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[41, 12, 7]])));
    expect(p.suggestedWeightKg).toBe(42.5);
  });

  it('no sube si el RPE medio supera 8 aunque llegue al tope', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 9], [40, 12, 9]])));
    expect(p.direction).not.toBe('up');
  });

  it('sube con RPE medio exactamente 8.0 (frontera inclusiva)', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 7], [40, 12, 9]])));
    expect(p.direction).toBe('up');
    expect(p.suggestedWeightKg).toBe(42.5);
  });
});

describe('prescribe — bajar peso', () => {
  it('alguna serie bajo el mínimo del rango → −2.5kg, reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 6, 9]])));
    expect(p).toEqual({ suggestedWeightKg: 37.5, suggestedReps: 8, direction: 'down' });
  });

  it('RPE medio ≥ 9.5 → baja aunque las reps estén en rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 10], [40, 9, 9]])));
    expect(p.direction).toBe('down');
  });

  it('suelo de 2.5kg', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[2.5, 6, 10]])));
    expect(p.suggestedWeightKg).toBe(2.5);
  });
});

describe('prescribe — mantener', () => {
  it('dentro del rango → mismo peso y mejor marca + 1', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 9, 8]])));
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 11, direction: 'keep' });
  });

  it('capa la sugerencia de reps al tope del rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 9, 8]])));
    expect(p.suggestedReps).toBe(12);
  });
});

describe('prescribe — cambio de objetivo', () => {
  it('conserva el peso de referencia y resetea reps al rango nuevo', () => {
    const p = svc.prescribe(barbell, 'Perder Peso', session('Volumen', sets([[40, 12, 7], [40, 12, 7]])));
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 12, direction: 'keep' });
  });
});

describe('autorregulación con la última sesión', () => {
  it('estima el 1RM real con Epley sobre reps + reps en reserva, mejor serie', () => {
    // 40 kg × 10 a RPE 8 → 12 reps al fallo → 40 × (1 + 12/30) = 56
    expect(estimateOneRepMaxFromSets(sets([[40, 10, 8], [40, 8, 8]]))).toBeCloseTo(56);
    expect(estimateOneRepMaxFromSets(sets([[0, 10, 8]]))).toBeNull();
  });

  it('carga muy por debajo de su fuerza → salta al peso calibrado, tope +20%', () => {
    // 20 kg × 12 a RPE 4: le sobraba muchísimo; la progresión normal daría solo 22.5
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[20, 12, 4], [20, 12, 4]])));
    expect(p).toEqual({ suggestedWeightKg: 25, suggestedReps: 8, direction: 'up' });
  });

  it('carga muy por encima → baja de golpe al peso calibrado', () => {
    // 60 kg × 3 a RPE 10 → 1RM ≈ 66 → 8 reps a RPE 8 ≈ 49.5 → 50 (la regla normal daría 57.5)
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[60, 3, 10], [60, 2, 10]])));
    expect(p).toEqual({ suggestedWeightKg: 50, suggestedReps: 8, direction: 'down' });
  });

  it('con cambio de objetivo recalcula el peso para el rango nuevo', () => {
    // 60 kg × 8 a RPE 8 → 1RM 80 → 12 reps a RPE 8 = 80 / (1 + 14/30) ≈ 54.5 → 55
    const p = svc.prescribe(barbell, 'Perder Peso', session('Volumen', sets([[60, 8, 8]])));
    expect(p).toEqual({ suggestedWeightKg: 55, suggestedReps: 12, direction: 'down' });
  });
});
