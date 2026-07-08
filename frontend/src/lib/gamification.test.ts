import { describe, it, expect } from 'vitest';
import type { WorkoutLog } from '../types';
import {
  computeGamification,
  computeLevel,
  computeXp,
  levelTitle,
  xpCostForLevel,
  LEVEL_TITLES,
  MASTERY_SESSIONS,
} from './gamification';

const workout = (id: string, volumeKg: number, exerciseId = 'ex-101'): WorkoutLog => ({
  id,
  date: `2026-07-0${(Number(id.slice(1)) % 9) + 1}T10:00:00Z`,
  split: 'Tren Superior',
  goal: 'Volumen',
  totalVolumeKg: volumeKg,
  exercises: [
    {
      exerciseId,
      exerciseName: `Ejercicio ${exerciseId}`,
      targetMuscle: 'Pecho',
      sets: [{ weightKg: 40, reps: 10, rpe: 8 }],
    },
  ],
});

describe('niveles y XP', () => {
  it('nivel 1 con 0 XP y coste creciente por nivel', () => {
    expect(computeLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 400 });
    expect(xpCostForLevel(1)).toBe(400);
    expect(xpCostForLevel(2)).toBe(600);
    expect(xpCostForLevel(3)).toBe(800);
  });

  it('sube de nivel exactamente en el umbral', () => {
    expect(computeLevel(399).level).toBe(1);
    expect(computeLevel(400)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 600 });
    // 400 + 600 = 1000 → nivel 3
    expect(computeLevel(1000).level).toBe(3);
  });

  it('los títulos avanzan y se quedan en Leyenda como tope', () => {
    expect(levelTitle(1)).toBe('Novato');
    expect(levelTitle(LEVEL_TITLES.length)).toBe('Leyenda');
    expect(levelTitle(99)).toBe('Leyenda');
  });

  it('computeXp combina entrenos, volumen, maestría y racha', () => {
    // 2 entrenos (200) + 1000 kg (4*25=100) + 1 dominado (150) + racha 3 (90)
    expect(computeXp(2, 1000, 1, 3)).toBe(540);
  });
});

describe('computeGamification — medallas', () => {
  it('sin historial: nada ganado, nivel 1', () => {
    const g = computeGamification([], 0);
    expect(g.earnedCount).toBe(0);
    expect(g.level).toBe(1);
    expect(g.levelTitle).toBe('Novato');
    expect(g.totalMedals).toBeGreaterThan(15);
  });

  it('primer entrenamiento gana la medalla Primer Paso', () => {
    const g = computeGamification([workout('w1', 500)], 1);
    const wk = g.medalGroups.find(gr => gr.id === 'workouts')!;
    expect(wk.medals.find(m => m.id === 'wk-1')!.earned).toBe(true);
    expect(wk.medals.find(m => m.id === 'wk-5')!.earned).toBe(false);
  });

  it('medallas de volumen respetan el umbral exacto', () => {
    const g = computeGamification([workout('w1', 1000)], 0);
    const vol = g.medalGroups.find(gr => gr.id === 'volume')!;
    expect(vol.medals.find(m => m.id === 'vol-1000')!.earned).toBe(true);
    expect(vol.medals.find(m => m.id === 'vol-5000')!.earned).toBe(false);
  });

  it('la mejor racha desbloquea medallas de racha', () => {
    const g = computeGamification([], 7);
    const stk = g.medalGroups.find(gr => gr.id === 'streak')!;
    expect(stk.medals.find(m => m.id === 'stk-3')!.earned).toBe(true);
    expect(stk.medals.find(m => m.id === 'stk-7')!.earned).toBe(true);
    expect(stk.medals.find(m => m.id === 'stk-14')!.earned).toBe(false);
  });

  it('un ejercicio con MASTERY_SESSIONS sesiones cuenta como dominado', () => {
    const logs = Array.from({ length: MASTERY_SESSIONS }, (_, i) => workout(`w${i + 1}`, 300));
    const g = computeGamification(logs, 0);
    expect(g.masteredExercises).toHaveLength(1);
    expect(g.masteredExercises[0].exerciseId).toBe('ex-101');
    const mst = g.medalGroups.find(gr => gr.id === 'mastery')!;
    expect(mst.medals.find(m => m.id === 'mst-1')!.earned).toBe(true);
  });

  it('con una sesión menos del umbral no hay dominio', () => {
    const logs = Array.from({ length: MASTERY_SESSIONS - 1 }, (_, i) => workout(`w${i + 1}`, 300));
    expect(computeGamification(logs, 0).masteredExercises).toHaveLength(0);
  });
});
