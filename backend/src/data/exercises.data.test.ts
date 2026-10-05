import { describe, it, expect } from 'vitest';
import type { Exercise } from '../types';
import exercisesData from './exercises.json';
import { needsApparatus, TARGET_OVERRIDES } from './equipmentRules';

const exercises = exercisesData as Exercise[];

// Huecos que rellena el generador por split: [categoría, músculo, nº de huecos]
// Fase 2 eliminó el filtro por dificultad — cualquier ejercicio puede tocar cualquier hueco.
// Todos los ejercicios importados tienen difficulty='intermediate' (dataset GitHub sin taxonomía).
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
  it('tiene al menos 1300 ejercicios en total', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(1300);
  });

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

  it('todos los ejercicios del dataset GitHub tienen difficulty=intermediate', () => {
    // El dataset de GitHub no tiene taxonomía de dificultad; todos se importan como
    // intermediate. Fase 2 eliminó el filtrado por dificultad (filterByDifficulty es
    // código muerto), así que esto no afecta la generación de rutinas.
    const nonIntermediate = exercises.filter(e => e.difficulty !== 'intermediate');
    expect(nonIntermediate.length).toBe(0);
  });

  it('cada hueco del generador tiene candidatos suficientes para gym y sin material', () => {
    // Sin filtro de dificultad (comportamiento real en tiempo de ejecución).
    for (const equipment of ['gym', 'none'] as const) {
      for (const [category, muscle, needed] of SLOTS) {
        const pool = exercises.filter(
          e =>
            e.split_category === category &&
            e.target_muscle === muscle &&
            e.equipment === equipment
        );
        expect(
          pool.length,
          `${category}/${muscle} equipment=${equipment}`
        ).toBeGreaterThanOrEqual(needed);
      }

      // Full Body añade un compuesto extra de la categoría 'ambos' distinto de Core
      const extras = exercises.filter(
        e =>
          e.split_category === 'ambos' &&
          e.target_muscle !== 'Core' &&
          e.equipment === equipment
      );
      expect(
        extras.length,
        `ambos extra equipment=${equipment}`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('ningún ejercicio "sin material" necesita un aparato', () => {
    const wrong = exercises.filter(e => e.equipment === 'none' && needsApparatus(e.name)).map(e => e.name);
    expect(wrong).toEqual([]);
  });

  it('las correcciones de músculo objetivo están aplicadas', () => {
    for (const [name, expected] of Object.entries(TARGET_OVERRIDES)) {
      for (const e of exercises.filter(x => x.name === name)) {
        expect(e.target_muscle, name).toBe(expected.target_muscle);
        expect(e.split_category, name).toBe(expected.split_category);
      }
    }
  });
});

describe('needsApparatus', () => {
  it('detecta barras, paralelas, anillas, gomas y máquinas', () => {
    for (const name of ['pull-up', 'archer pull up', 'chin-up', 'chest dip', 'ring dips', 'band shoulder press',
      'hanging leg raise', 'front lever', 'suspended row', 'inverted row', 'roller body saw', 'run (equipment)']) {
      expect(needsApparatus(name), name).toBe(true);
    }
  });

  it('suelo, pared, banco, escalón o toalla no cuentan como aparato', () => {
    for (const name of ['push-up', 'bench dip (knees bent)', 'triceps dips floor', 'push-up (wall)',
      'one arm towel row', 'standing calf raise (on a staircase)', 'burpee', 'full planche']) {
      expect(needsApparatus(name), name).toBe(false);
    }
  });
});
