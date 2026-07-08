import { describe, it, expect } from 'vitest';
import { RoutineService } from './routineService';
import { Exercise, ExerciseHistorySummary, UserProfile } from '../types';

const ex = (id: string, muscle: string, factor = 1.0, equipment: Exercise['equipment'] = 'gym'): Exercise => ({
  id, name: `Ejercicio ${id}`, target_muscle: muscle,
  split_category: muscle === 'Core' ? 'ambos'
    : ['Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos'].includes(muscle) ? 'tren_inferior' : 'tren_superior',
  difficulty: 'intermediate', description: '', weight_factor: factor, equipment,
});

const catalog: Exercise[] = [
  ex('pecho-a', 'Pecho'), ex('pecho-b', 'Pecho'), ex('pecho-c', 'Pecho'),
  ex('espalda-a', 'Espalda'), ex('espalda-b', 'Espalda'), ex('espalda-c', 'Espalda'),
  ex('hombros-a', 'Hombros'), ex('hombros-b', 'Hombros'),
  ex('biceps-a', 'Bíceps'), ex('triceps-a', 'Tríceps'),
];

const repo = { getAll: async () => catalog };

const profile: UserProfile = {
  weightKg: 80, heightCm: 180, age: 30, sex: 'masculino',
  experience: 'intermediate', split: 'Tren Superior', goal: 'Volumen',
  equipment: 'gym',
};

const historyFor = (exerciseId: string): ExerciseHistorySummary => ({
  exerciseId,
  lastSession: {
    date: '2026-07-01T10:00:00.000Z',
    goal: 'Volumen',
    sets: [
      { weightKg: 40, reps: 12, rpe: 7 },
      { weightKg: 40, reps: 12, rpe: 8 },
    ],
  },
});

describe('generateRoutine con historial', () => {
  it('con rng < 0.7 los huecos eligen ejercicios con historial', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-c'), historyFor('espalda-c')]);
    const ids = routine.exercises.map(e => e.exercise.id);
    expect(ids).toContain('pecho-c');
    expect(ids).toContain('espalda-c');
  });

  it('el ejercicio con historial al tope recibe subida de peso y direction up', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-c')]);
    const item = routine.exercises.find(e => e.exercise.id === 'pecho-c')!;
    expect(item.progressionDirection).toBe('up');
    expect(item.sets[0].suggestedWeightKg).toBe(42.5);
    expect(item.sets[0].suggestedReps).toBe(8); // mínimo del rango Volumen
  });

  it('ejercicios sin historial usan fallback sin progressionDirection y reps al mínimo del rango', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, []);
    for (const item of routine.exercises) {
      expect(item.progressionDirection).toBeUndefined();
      expect(item.sets[0].suggestedReps).toBe(8);
    }
  });

  it('no repite ejercicios aunque el historial cubra varios huecos del mismo músculo', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-a'), historyFor('pecho-b')]);
    const ids = routine.exercises.map(e => e.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('filtro por material (equipment)', () => {
  const mixedCatalog: Exercise[] = [
    ex('pecho-gym-a', 'Pecho'), ex('pecho-gym-b', 'Pecho'),
    ex('pecho-pc-a', 'Pecho', 0, 'none'), ex('pecho-pc-b', 'Pecho', 0, 'none'),
    ex('espalda-gym-a', 'Espalda'), ex('espalda-gym-b', 'Espalda'),
    ex('espalda-pc-a', 'Espalda', 0, 'none'), ex('espalda-pc-b', 'Espalda', 0, 'none'),
    ex('hombros-pc-a', 'Hombros', 0, 'none'), ex('hombros-gym-a', 'Hombros'),
    ex('biceps-pc-a', 'Bíceps', 0, 'none'), ex('triceps-pc-a', 'Tríceps', 0, 'none'),
  ];
  const mixedRepo = { getAll: async () => mixedCatalog };

  it('con equipment none la rutina solo contiene ejercicios sin material', async () => {
    const svc = new RoutineService(mixedRepo, () => 0);
    const routine = await svc.generateRoutine({ ...profile, equipment: 'none' });
    expect(routine.exercises.length).toBeGreaterThan(0);
    for (const item of routine.exercises) {
      expect(item.exercise.equipment).toBe('none');
    }
  });

  it('con equipment gym se usa el catálogo completo', async () => {
    const svc = new RoutineService(mixedRepo, () => 0);
    const routine = await svc.generateRoutine({ ...profile, equipment: 'gym' });
    const equipments = routine.exercises.map(e => e.exercise.equipment);
    expect(equipments).toContain('gym');
  });

  it('el reroll con equipment none nunca devuelve ejercicios de gimnasio', async () => {
    const svc = new RoutineService(mixedRepo, () => 0);
    const result = await svc.rerollExercise('Pecho', ['pecho-pc-a'], { ...profile, equipment: 'none' });
    expect(result.exercise.equipment).toBe('none');
    expect(result.exercise.id).toBe('pecho-pc-b');
  });
});

describe('rerollExercise con historial', () => {
  it('aplica prescripción si el ejercicio elegido tiene historial', async () => {
    const svc = new RoutineService(repo, () => 0);
    const result = await svc.rerollExercise(
      'Pecho',
      ['pecho-a', 'pecho-b'], // solo queda pecho-c
      profile,
      [historyFor('pecho-c')]
    );
    expect(result.exercise.id).toBe('pecho-c');
    expect(result.progressionDirection).toBe('up');
    expect(result.sets[0].suggestedWeightKg).toBe(42.5);
  });
});
