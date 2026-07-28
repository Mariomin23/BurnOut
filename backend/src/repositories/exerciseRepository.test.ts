import { describe, it, expect } from 'vitest';
import { JsonExerciseRepository, normalizeText } from './exerciseRepository';
import { buildSearchPattern } from './mongoExerciseRepository';

const repo = new JsonExerciseRepository();

describe('normalizeText', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('  Bíceps Braquial ')).toBe('biceps braquial');
  });
});

describe('JsonExerciseRepository.search', () => {
  it('encuentra por nombre ignorando mayúsculas y tildes', async () => {
    const results = await repo.search('biceps');
    expect(results.length).toBeGreaterThan(0);
    for (const ex of results) {
      const haystack = normalizeText(`${ex.name} ${ex.target_muscle}`);
      expect(haystack).toContain('biceps');
    }
  });

  it('devuelve vacío con búsqueda en blanco', async () => {
    expect(await repo.search('   ')).toEqual([]);
  });

  it('respeta el límite', async () => {
    const results = await repo.search('press', { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('filtra por material cuando se pide sin equipamiento', async () => {
    const results = await repo.search('a', { equipment: 'none', limit: 50 });
    for (const ex of results) {
      expect(ex.equipment).toBe('none');
    }
  });
});

describe('buildSearchPattern (Mongo)', () => {
  it('casa con y sin tilde', () => {
    const pattern = buildSearchPattern('biceps');
    expect(pattern.test('Curl de Bíceps')).toBe(true);
    expect(pattern.test('Curl de Biceps')).toBe(true);
  });

  it('escapa los metacaracteres del término', () => {
    const pattern = buildSearchPattern('press.*');
    expect(pattern.test('press de banca')).toBe(false);
    expect(pattern.test('press.* raro')).toBe(true);
  });
});
