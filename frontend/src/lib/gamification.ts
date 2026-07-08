import type { WorkoutLog } from '../types';
import { listTrackedExercises, type TrackedExercise } from './progress';

/** Sesiones registradas de un ejercicio para considerarlo dominado */
export const MASTERY_SESSIONS = 5;

export interface Medal {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export interface MedalGroup {
  id: 'volume' | 'workouts' | 'streak' | 'mastery';
  title: string;
  medals: Medal[];
}

export interface GamificationState {
  totalWorkouts: number;
  totalVolumeKg: number;
  bestStreak: number;
  masteredExercises: TrackedExercise[];
  medalGroups: MedalGroup[];
  earnedCount: number;
  totalMedals: number;
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

const VOLUME_TIERS: Array<[number, string, string]> = [
  [1_000, '🥉', 'Primera Tonelada'],
  [5_000, '🥈', 'Cinco Toneladas'],
  [10_000, '🥇', 'Camión Pesado'],
  [25_000, '🐋', 'Ballena Azul'],
  [50_000, '✈️', 'Peso de un Avión'],
  [100_000, '🚂', 'Locomotora'],
  [250_000, '🚢', 'Transatlántico'],
];

const WORKOUT_TIERS: Array<[number, string, string]> = [
  [1, '👟', 'Primer Paso'],
  [5, '🔥', 'Calentando Motores'],
  [10, '⚒️', 'Hábito Forjado'],
  [25, '🛡️', 'Constancia de Acero'],
  [50, '🎯', 'Media Centena'],
  [100, '🏛️', 'Centurión'],
];

const STREAK_TIERS: Array<[number, string, string]> = [
  [3, '⚡', 'Tres al Hilo'],
  [7, '📅', 'Semana Perfecta'],
  [14, '🚀', 'Quincena Imparable'],
  [30, '🗓️', 'Mes de Hierro'],
];

const MASTERY_TIERS: Array<[number, string, string]> = [
  [1, '🎓', 'Primer Dominio'],
  [3, '📚', 'Repertorio Creciente'],
  [5, '🧠', 'Técnico Consumado'],
  [10, '👑', 'Maestro del Gimnasio'],
];

export const LEVEL_TITLES = [
  'Novato', 'Principiante', 'Constante', 'Dedicado', 'Disciplinado',
  'Atleta', 'Competidor', 'Veterano', 'Élite', 'Titán', 'Leyenda',
];

/** XP necesaria para pasar del nivel `n` al `n+1` (progresión aritmética) */
export function xpCostForLevel(n: number): number {
  return 400 + (n - 1) * 200;
}

export function computeXp(totalWorkouts: number, totalVolumeKg: number, masteredCount: number, bestStreak: number): number {
  return (
    totalWorkouts * 100 +
    Math.floor(totalVolumeKg / 250) * 25 +
    masteredCount * 150 +
    bestStreak * 30
  );
}

export function computeLevel(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpCostForLevel(level)) {
    remaining -= xpCostForLevel(level);
    level++;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpCostForLevel(level) };
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

const buildMedals = (
  tiers: Array<[number, string, string]>,
  prefix: string,
  value: number,
  describe: (threshold: number) => string
): Medal[] =>
  tiers.map(([threshold, emoji, title]) => ({
    id: `${prefix}-${threshold}`,
    emoji,
    title,
    description: describe(threshold),
    earned: value >= threshold,
  }));

export function computeGamification(history: WorkoutLog[], bestStreak: number): GamificationState {
  const totalWorkouts = history.length;
  const totalVolumeKg = Math.round(history.reduce((sum, w) => sum + w.totalVolumeKg, 0));
  const masteredExercises = listTrackedExercises(history).filter(t => t.sessions >= MASTERY_SESSIONS);

  const medalGroups: MedalGroup[] = [
    {
      id: 'volume',
      title: 'Volumen Total',
      medals: buildMedals(VOLUME_TIERS, 'vol', totalVolumeKg, t => `Levanta ${t.toLocaleString('es-ES')} kg acumulados`),
    },
    {
      id: 'workouts',
      title: 'Entrenamientos',
      medals: buildMedals(WORKOUT_TIERS, 'wk', totalWorkouts, t => (t === 1 ? 'Completa tu primer entrenamiento' : `Completa ${t} entrenamientos`)),
    },
    {
      id: 'streak',
      title: 'Rachas',
      medals: buildMedals(STREAK_TIERS, 'stk', bestStreak, t => `Entrena ${t} días seguidos`),
    },
    {
      id: 'mastery',
      title: 'Maestría',
      medals: buildMedals(MASTERY_TIERS, 'mst', masteredExercises.length, t =>
        t === 1
          ? `Domina un ejercicio (${MASTERY_SESSIONS} sesiones)`
          : `Domina ${t} ejercicios (${MASTERY_SESSIONS} sesiones cada uno)`
      ),
    },
  ];

  const earnedCount = medalGroups.reduce((sum, g) => sum + g.medals.filter(m => m.earned).length, 0);
  const totalMedals = medalGroups.reduce((sum, g) => sum + g.medals.length, 0);

  const xp = computeXp(totalWorkouts, totalVolumeKg, masteredExercises.length, bestStreak);
  const { level, xpIntoLevel, xpForNextLevel } = computeLevel(xp);

  return {
    totalWorkouts,
    totalVolumeKg,
    bestStreak,
    masteredExercises,
    medalGroups,
    earnedCount,
    totalMedals,
    xp,
    level,
    levelTitle: levelTitle(level),
    xpIntoLevel,
    xpForNextLevel,
  };
}
