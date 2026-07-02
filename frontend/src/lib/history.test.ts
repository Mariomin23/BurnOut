import { describe, it, expect } from 'vitest';
import { buildWorkoutLog, appendToHistory, summarizeHistory } from './history';
import type { WorkoutRoutine, WorkoutLog } from '../types';

const routine = (overrides: Partial<WorkoutRoutine> = {}): WorkoutRoutine => ({
  id: 'r-1',
  split: 'Tren Superior',
  goal: 'Volumen',
  warmup: [],
  cooldown: [],
  createdAt: '2026-07-02T10:00:00.000Z',
  isCompleted: false,
  exercises: [
    {
      exercise: {
        id: 'ex-101', name: 'Press de Banca con Barra', target_muscle: 'Pecho',
        split_category: 'tren_superior', difficulty: 'intermediate', description: '',
      },
      restTimerSeconds: 120,
      sets: [
        { setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40, completed: true, completedReps: 10, completedWeightKg: 40, completedRpe: 8 },
        { setIndex: 2, suggestedReps: 8, suggestedWeightKg: 40, completed: false, completedReps: 5 },
      ],
    },
    {
      exercise: {
        id: 'ex-102', name: 'Remo con Barra', target_muscle: 'Espalda',
        split_category: 'tren_superior', difficulty: 'intermediate', description: '',
      },
      restTimerSeconds: 120,
      sets: [{ setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40 }],
    },
  ],
  ...overrides,
});

const log = (id: string, date: string, exerciseId = 'ex-101'): WorkoutLog => ({
  id, date, split: 'Tren Superior', goal: 'Volumen', totalVolumeKg: 400,
  exercises: [{ exerciseId, exerciseName: 'X', targetMuscle: 'Pecho', sets: [{ weightKg: 40, reps: 10, rpe: 8 }] }],
});

describe('buildWorkoutLog', () => {
  it('solo incluye series completed y descarta ejercicios sin ninguna', () => {
    const result = buildWorkoutLog(routine(), '2026-07-02T11:00:00.000Z')!;
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].sets).toEqual([{ weightKg: 40, reps: 10, rpe: 8 }]);
    expect(result.date).toBe('2026-07-02T11:00:00.000Z');
    expect(result.totalVolumeKg).toBe(400);
  });

  it('devuelve null si no hay ninguna serie completada', () => {
    const empty = routine();
    empty.exercises.forEach(e => e.sets.forEach(s => { s.completed = false; }));
    expect(buildWorkoutLog(empty, '2026-07-02T11:00:00.000Z')).toBeNull();
  });

  it('serie completada sin datos usa 0/0 y RPE 8', () => {
    const r = routine();
    r.exercises[0].sets = [{ setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40, completed: true }];
    const result = buildWorkoutLog(r, '2026-07-02T11:00:00.000Z')!;
    expect(result.exercises[0].sets).toEqual([{ weightKg: 0, reps: 0, rpe: 8 }]);
  });
});

describe('appendToHistory', () => {
  it('añade al final y respeta el cap FIFO', () => {
    const history = Array.from({ length: 100 }, (_, i) => log(`w-${i}`, `2026-01-01T00:00:0${i % 10}.000Z`));
    const next = appendToHistory(history, log('w-new', '2026-07-02T11:00:00.000Z'), 100);
    expect(next).toHaveLength(100);
    expect(next[99].id).toBe('w-new');
    expect(next[0].id).toBe('w-1'); // el más antiguo cae
  });
});

describe('summarizeHistory', () => {
  it('devuelve la sesión más reciente por ejercicio', () => {
    const history = [
      log('w-1', '2026-06-01T10:00:00.000Z'),
      log('w-2', '2026-07-01T10:00:00.000Z'),
    ];
    const summary = summarizeHistory(history);
    expect(summary).toHaveLength(1);
    expect(summary[0].lastSession.date).toBe('2026-07-01T10:00:00.000Z');
  });

  it('capa a 30 ejercicios, priorizando los más recientes', () => {
    const history = Array.from({ length: 40 }, (_, i) =>
      log(`w-${i}`, `2026-06-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`, `ex-${i}`)
    );
    const summary = summarizeHistory(history, 30);
    expect(summary).toHaveLength(30);
    expect(summary.map(s => s.exerciseId)).toContain('ex-39'); // el último workout entra
  });
});
