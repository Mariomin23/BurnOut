import { describe, it, expect } from 'vitest';
import type { Exercise, Difficulty } from '../types';
import exercisesData from './exercises.json';

const exercises = exercisesData as Exercise[];

// Pools de dificultad que ve cada nivel de experiencia (ver RoutineService.filterByDifficulty)
const DIFF_POOL: Record<Difficulty, Difficulty[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
};

// Huecos que rellena el generador por split: [categoría, músculo, nº de huecos]
const SLOTS: Array<[string, string, number]> = [
  ['tren_superior', 'Pecho', 2],
  ['tren_superior', 'Espalda', 2],
  ['tren_superior', 'Hombros', 1],
  ['tren_superior', 'Bíceps', 1],
  ['tren_superior', 'Tríceps', 1],
  ['tren_inferior', 'Cuádriceps', 2],
  ['tren_inferior', 'Femorales', 2],
  ['tren_inferior', 'Glúteos', 1],
  ['tren_inferior', 'Gemelos', 1],
  ['ambos', 'Core', 1],
];

describe('exercises.json — invariantes de la biblioteca', () => {
  it('tiene al menos 50 ejercicios por categoría de split', () => {
    const byCategory = new Map<string, number>();
    for (const e of exercises) {
      byCategory.set(e.split_category, (byCategory.get(e.split_category) ?? 0) + 1);
    }
    expect(byCategory.get('tren_superior')).toBeGreaterThanOrEqual(50);
    expect(byCategory.get('tren_inferior')).toBeGreaterThanOrEqual(50);
    expect(byCategory.get('ambos')).toBeGreaterThanOrEqual(50);
  });

  it('no tiene IDs duplicados', () => {
    const ids = exercises.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los ejercicios tienen los campos obligatorios válidos', () => {
    for (const e of exercises) {
      expect(e.id, e.id).toBeTruthy();
      expect(e.name, e.id).toBeTruthy();
      expect(e.description, e.id).toBeTruthy();
      expect(['tren_superior', 'tren_inferior', 'ambos'], e.id).toContain(e.split_category);
      expect(['beginner', 'intermediate', 'advanced'], e.id).toContain(e.difficulty);
      expect(['gym', 'none'], e.id).toContain(e.equipment);
      expect(e.weight_factor, e.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('cada hueco del generador tiene candidatos para toda combinación de experiencia y material', () => {
    for (const experience of Object.keys(DIFF_POOL) as Difficulty[]) {
      for (const equipment of ['gym', 'none'] as const) {
        for (const [category, muscle, needed] of SLOTS) {
          const pool = exercises.filter(
            e =>
              e.split_category === category &&
              e.target_muscle === muscle &&
              DIFF_POOL[experience].includes(e.difficulty) &&
              (equipment === 'gym' || e.equipment === 'none')
          );
          expect(
            pool.length,
            `${category}/${muscle} experience=${experience} equipment=${equipment}`
          ).toBeGreaterThanOrEqual(needed);
        }

        // Full Body añade un compuesto extra de la categoría 'ambos' distinto de Core
        const extras = exercises.filter(
          e =>
            e.split_category === 'ambos' &&
            e.target_muscle !== 'Core' &&
            DIFF_POOL[experience].includes(e.difficulty) &&
            (equipment === 'gym' || e.equipment === 'none')
        );
        expect(
          extras.length,
          `ambos extra experience=${experience} equipment=${equipment}`
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
