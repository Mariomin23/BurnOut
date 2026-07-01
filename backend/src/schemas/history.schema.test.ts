import { describe, it, expect } from 'vitest';
import { HistorySchema } from './userProfile.schema';

const validEntry = {
  exerciseId: 'ex-101',
  lastSession: {
    date: '2026-07-01T10:00:00.000Z',
    goal: 'Volumen',
    sets: [{ weightKg: 40, reps: 10, rpe: 8 }],
  },
};

describe('HistorySchema', () => {
  it('acepta un historial válido', () => {
    expect(HistorySchema.safeParse([validEntry]).success).toBe(true);
  });

  it('acepta array vacío', () => {
    expect(HistorySchema.safeParse([]).success).toBe(true);
  });

  it('rechaza más de 30 entradas', () => {
    const many = Array.from({ length: 31 }, (_, i) => ({
      ...validEntry, exerciseId: `ex-${i}`,
    }));
    expect(HistorySchema.safeParse(many).success).toBe(false);
  });

  it('rechaza más de 10 sets por entrada', () => {
    const entry = {
      ...validEntry,
      lastSession: { ...validEntry.lastSession, sets: Array(11).fill({ weightKg: 40, reps: 10, rpe: 8 }) },
    };
    expect(HistorySchema.safeParse([entry]).success).toBe(false);
  });

  it('rechaza rpe fuera de 1-10, reps > 100 y peso > 500 o negativo', () => {
    const bad = (set: object) => ({
      ...validEntry,
      lastSession: { ...validEntry.lastSession, sets: [set] },
    });
    expect(HistorySchema.safeParse([bad({ weightKg: 40, reps: 10, rpe: 11 })]).success).toBe(false);
    expect(HistorySchema.safeParse([bad({ weightKg: 40, reps: 101, rpe: 8 })]).success).toBe(false);
    expect(HistorySchema.safeParse([bad({ weightKg: 501, reps: 10, rpe: 8 })]).success).toBe(false);
    expect(HistorySchema.safeParse([bad({ weightKg: -1, reps: 10, rpe: 8 })]).success).toBe(false);
  });

  it('rechaza objetivo desconocido', () => {
    const entry = { ...validEntry, lastSession: { ...validEntry.lastSession, goal: 'Fuerza' } };
    expect(HistorySchema.safeParse([entry]).success).toBe(false);
  });
});
