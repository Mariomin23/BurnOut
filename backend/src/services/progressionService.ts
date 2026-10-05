import { Exercise, ExerciseHistorySummary, GoalLabel, ProgressionDirection, UserProfile } from '../types';

export interface GoalProfile {
  reps: { min: number; max: number };
  /** % del 1RM ajustado para la carga de la primera sesión */
  intensity: number;
  /** RPE de trabajo: más bajo cuanto más lejos del fallo se quiere entrenar */
  targetRpe: number;
  restSeconds: number;
  /** Series extra sobre la base del nivel */
  extraSets: number;
}

/**
 * Los tres objetivos de la app (en la interfaz: Hipertrofia, Salud y Definir).
 * Cada uno cambia reps, carga, esfuerzo, descanso y volumen:
 * - Hipertrofia: cargas altas, pocas reps, descanso largo y una serie más.
 * - Salud: carga moderada lejos del fallo, descanso medio.
 * - Definir: muchas reps con descanso corto para mantener el pulso alto.
 */
export const GOAL_PROFILE: Record<GoalLabel, GoalProfile> = {
  'Volumen': { reps: { min: 8, max: 12 }, intensity: 0.7, targetRpe: 8, restSeconds: 120, extraSets: 1 },
  'Mantenerse Activo': { reps: { min: 10, max: 12 }, intensity: 0.6, targetRpe: 7, restSeconds: 90, extraSets: 0 },
  'Perder Peso': { reps: { min: 12, max: 15 }, intensity: 0.65, targetRpe: 8, restSeconds: 60, extraSets: 0 },
};

export const GOAL_REP_RANGE: Record<GoalLabel, { min: number; max: number }> = {
  'Perder Peso': GOAL_PROFILE['Perder Peso'].reps,
  'Volumen': GOAL_PROFILE['Volumen'].reps,
  'Mantenerse Activo': GOAL_PROFILE['Mantenerse Activo'].reps,
};

export interface Prescription {
  suggestedWeightKg: number;
  suggestedReps: number;
  direction?: ProgressionDirection;
  /** RPE al que apuntar en la primera sesión (sin historial) */
  targetRpe?: number;
}

/** Datos del usuario que entran en el cálculo de la carga inicial */
export type LifterProfile = Pick<UserProfile, 'weightKg' | 'age' | 'experience' | 'sex'>;

// --- Carga inicial (repes.md) ---------------------------------------------
// Paso 1: 1RM teórico = peso corporal × multiplicador del patrón de movimiento.
// Solo se cubren los patrones que define la tabla; el resto del catálogo sigue
// saliendo en blanco la primera vez (no se inventan multiplicadores).
const SQUAT_DEADLIFT_FACTOR = 1.5;
const BENCH_FACTOR = 1.0;
const ISOLATION_FACTOR = 0.25;

const SQUAT_DEADLIFT = /squat|deadlift|sentadilla|peso muerto/i;
const BENCH_PRESS = /bench press|chest press|press (de )?banca/i;
/**
 * Variantes que comparten nombre con el básico pero no su carga: pliométricas,
 * unilaterales, de equilibrio, combinadas o con polea. Aplicarles el 1RM de la
 * sentadilla/banca daría pesos peligrosos, así que no cuentan como básico.
 */
const NON_STANDARD_VARIANT = /jump|plyo|speed|lunge|split|single leg|one leg|one arm|pistol|overhead|zercher|jefferson|sissy|cossack|knee|jerk|get up|step-?up|bosu|curl|\brow\b|calf|frankenstein|twisting|guillotine|\bjm\b|cable/i;
const ISOLATION_MUSCLES = new Set(['Bíceps', 'Tríceps', 'Hombros']);
/** Material cuya carga no se mide en kg en la barra: sin sugerencia de peso */
const NO_KG_IMPLEMENT = /\b(exercise ball|stability ball|medicine ball|bosu|assisted|band|battling|tire|roller)\b/i;
/** Con mancuernas/kettlebells el usuario anota el peso de cada mano: la carga total se reparte */
const PER_HAND_IMPLEMENT = /\b(dumbbells?|kettlebells?|mancuernas?)\b/i;

// Paso 2: modificadores
const LEVEL_MODIFIER: Record<UserProfile['experience'], number> = {
  beginner: 0.7,
  intermediate: 1.0,
  advanced: 1.3,
};

// La tabla está pensada en estándares masculinos. Relación aproximada de los
// estándares de fuerza femeninos respecto a los masculinos a igual peso corporal:
// mayor diferencia en tren superior que en inferior.
const FEMALE_LOWER_BODY_MODIFIER = 0.75;
const FEMALE_UPPER_BODY_MODIFIER = 0.6;

function ageModifier(age: number): number {
  // Menores de 18: la tabla no los cubre; se aplica el tramo más conservador
  if (age < 18 || age > 50) return 0.8;
  if (age > 35) return 0.9;
  return 1.0;
}

// Paso 3: % del 1RM ajustado → GOAL_PROFILE.intensity. La tabla da 70% para
// 8-12 reps (y 85% para 3-5), que equivale a la carga del tope del rango según
// Epley; 12-15 reps sigue esa misma regla → 65%. Salud baja al 60% a RPE 7.

// --- Autorregulación con la última sesión -----------------------------------
/** Epley deja de ser fiable con muchas reps: se acota el total reps + reserva */
const EPLEY_MAX_REPS = 20;
/** Nunca se sube más de un 20% de golpe, por mucho que diga la estimación */
const MAX_CALIBRATION_JUMP = 1.2;
/** Desvío relativo a partir del cual la carga se considera mal calibrada */
const CALIBRATION_TOLERANCE = 0.15;

/**
 * 1RM real estimado con lo que el usuario anotó: Epley sobre las reps hechas más
 * las que le quedaban en reserva (RPE 8 = 2 en reserva). Se queda con la mejor serie.
 */
export function estimateOneRepMaxFromSets(sets: ExerciseHistorySummary['lastSession']['sets']): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.weightKg <= 0 || set.reps <= 0) continue;
    const repsToFailure = Math.min(set.reps + Math.max(10 - set.rpe, 0), EPLEY_MAX_REPS);
    const estimate = set.weightKg * (1 + repsToFailure / 30);
    if (best === null || estimate > best) best = estimate;
  }
  return best;
}

/** Peso con el que ese 1RM da `reps` repeticiones al RPE de trabajo del objetivo. */
function weightForReps(oneRepMaxKg: number, reps: number, targetRpe: number): number {
  return oneRepMaxKg / (1 + (reps + (10 - targetRpe)) / 30);
}

// Regla especial de autocargas: ejercicios donde se levanta todo el cuerpo y no
// se puede bajar el peso. Excluye variantes asistidas o en banco/suelo.
const FULL_BODYWEIGHT = /pull-?ups?|chin-?ups?|muscle.?ups?|\bdips?\b|handstand push-?up|pistol|(front|back) lever|planche|maltese|dominadas?|fondos/i;
const EASED_BODYWEIGHT = /assisted|bench|scapula|pulldown|floor|elbow|machine|banco|asistid/i;
const HARD_BODYWEIGHT_REPS = { min: 3, max: 5 };
const HARD_BODYWEIGHT_RPE = 9;

/** 1RM teórico ajustado por edad y nivel, o null si la tabla no cubre el ejercicio. */
export function estimateOneRepMaxKg(exercise: Exercise, profile: LifterProfile): number | null {
  if ((exercise.weight_factor ?? 1) === 0 || NO_KG_IMPLEMENT.test(exercise.name)) return null;

  let baseFactor: number;
  let splitsAcrossHands = false;
  let lowerBody = false;
  const standard = !NON_STANDARD_VARIANT.test(exercise.name);
  if (standard && SQUAT_DEADLIFT.test(exercise.name)) {
    baseFactor = SQUAT_DEADLIFT_FACTOR;
    splitsAcrossHands = true;
    lowerBody = true;
  } else if (standard && BENCH_PRESS.test(exercise.name)) {
    baseFactor = BENCH_FACTOR;
    splitsAcrossHands = true;
  } else if (ISOLATION_MUSCLES.has(exercise.target_muscle)) {
    baseFactor = ISOLATION_FACTOR;
  } else {
    return null;
  }

  const perHand = splitsAcrossHands && PER_HAND_IMPLEMENT.test(exercise.name) ? 0.5 : 1;
  const sexModifier = profile.sex !== 'femenino' ? 1
    : lowerBody ? FEMALE_LOWER_BODY_MODIFIER : FEMALE_UPPER_BODY_MODIFIER;
  return profile.weightKg * baseFactor * perHand * sexModifier
    * ageModifier(profile.age) * LEVEL_MODIFIER[profile.experience];
}

/**
 * Autocargas duras: con más de 85 kg, nivel principiante o más de 40 años no es
 * realista pedir 8+ reps. Devuelve las reps reducidas (3-5; menos cuantas más
 * condiciones se cumplan) o null si la regla no aplica.
 */
export function hardBodyweightReps(exercise: Exercise, profile: LifterProfile): number | null {
  if ((exercise.weight_factor ?? 1) !== 0) return null;
  if (!FULL_BODYWEIGHT.test(exercise.name) || EASED_BODYWEIGHT.test(exercise.name)) return null;

  const limiters = [profile.weightKg > 85, profile.experience === 'beginner', profile.age > 40]
    .filter(Boolean).length;
  if (limiters === 0) return null;
  return Math.max(HARD_BODYWEIGHT_REPS.max - (limiters - 1), HARD_BODYWEIGHT_REPS.min);
}

export class ProgressionService {
  public prescribe(
    exercise: Exercise,
    goal: GoalLabel,
    lastSession: ExerciseHistorySummary['lastSession'] | undefined,
    profile?: LifterProfile
  ): Prescription {
    const range = GOAL_REP_RANGE[goal];
    const loadFactor = exercise.weight_factor ?? 1;

    const reducedReps = profile ? hardBodyweightReps(exercise, profile) : null;

    if (!lastSession || lastSession.sets.length === 0) {
      return this.firstSession(exercise, goal, profile, reducedReps);
    }

    const bestReps = Math.max(...lastSession.sets.map(s => s.reps));

    if (loadFactor === 0) {
      // Con la regla de autocargas el punto de partida es bajo: se progresa de
      // rep en rep sin saltar al mínimo del rango del objetivo
      return {
        suggestedWeightKg: 0,
        suggestedReps: Math.min(bestReps + 1, range.max),
        direction: 'keep',
        ...(reducedReps !== null && bestReps < range.min ? { targetRpe: HARD_BODYWEIGHT_RPE } : {}),
      };
    }

    const refWeight = Math.max(...lastSession.sets.map(s => s.weightKg));
    const increment = loadFactor >= 1.2 ? 5 : 2.5;

    // Autorregulación: lo anotado dice cuál es su fuerza real. Si la carga
    // estaba claramente descalibrada (tabla inicial, primer peso a ojo, cambio
    // de objetivo) se salta directamente al peso que le corresponde.
    const realOneRepMax = estimateOneRepMaxFromSets(lastSession.sets);
    const calibrated = realOneRepMax === null ? null
      : this.round(Math.min(
          weightForReps(realOneRepMax, range.min, GOAL_PROFILE[goal].targetRpe),
          refWeight * MAX_CALIBRATION_JUMP
        ));
    const tolerance = Math.max(increment, refWeight * CALIBRATION_TOLERANCE);
    const offTarget = calibrated !== null && Math.abs(calibrated - refWeight) > tolerance;

    if (lastSession.goal !== goal) {
      // Otro rango de reps: el peso anterior solo sirve si no hay estimación
      const weight = calibrated ?? this.round(refWeight);
      return {
        suggestedWeightKg: weight,
        suggestedReps: range.min,
        direction: weight > refWeight ? 'up' : weight < this.round(refWeight) ? 'down' : 'keep',
      };
    }

    if (offTarget) {
      return {
        suggestedWeightKg: calibrated,
        suggestedReps: range.min,
        direction: calibrated > refWeight ? 'up' : 'down',
      };
    }

    const avgRpe = lastSession.sets.reduce((sum, s) => sum + s.rpe, 0) / lastSession.sets.length;
    const allAtTop = lastSession.sets.every(s => s.reps >= range.max);
    const anyBelowMin = lastSession.sets.some(s => s.reps < range.min);

    if (allAtTop && avgRpe <= 8) {
      return { suggestedWeightKg: this.round(refWeight + increment), suggestedReps: range.min, direction: 'up' };
    }
    if (anyBelowMin || avgRpe >= 9.5) {
      return { suggestedWeightKg: this.round(refWeight - 2.5), suggestedReps: range.min, direction: 'down' };
    }
    return {
      suggestedWeightKg: this.round(refWeight),
      suggestedReps: Math.min(bestReps + 1, range.max),
      direction: 'keep',
    };
  }

  /** Sin historial: carga inicial de la tabla, o en blanco si no la cubre. */
  private firstSession(
    exercise: Exercise,
    goal: GoalLabel,
    profile: LifterProfile | undefined,
    reducedReps: number | null
  ): Prescription {
    const range = GOAL_REP_RANGE[goal];
    if (reducedReps !== null) {
      return { suggestedWeightKg: 0, suggestedReps: reducedReps, targetRpe: HARD_BODYWEIGHT_RPE };
    }

    const oneRepMax = profile ? estimateOneRepMaxKg(exercise, profile) : null;
    if (oneRepMax === null) {
      return { suggestedWeightKg: 0, suggestedReps: range.min };
    }
    return {
      suggestedWeightKg: this.roundDown(oneRepMax * GOAL_PROFILE[goal].intensity),
      suggestedReps: range.min,
      targetRpe: GOAL_PROFILE[goal].targetRpe,
    };
  }

  /** Primera carga: siempre hacia abajo, es más seguro quedarse corto que pasarse */
  private roundDown(weightKg: number): number {
    return Math.max(Math.floor(weightKg / 2.5) * 2.5, 2.5);
  }

  private round(weightKg: number): number {
    return Math.max(Math.round(weightKg / 2.5) * 2.5, 2.5);
  }
}
