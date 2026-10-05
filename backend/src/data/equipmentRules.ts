/**
 * Reglas de clasificación "Sin material" del catálogo. El dataset de origen
 * marca como peso corporal muchos ejercicios que en realidad necesitan un
 * aparato (barra de dominadas, paralelas, anillas, gomas…). "Sin material"
 * significa que se puede hacer en casa sin nada: suelo, pared, silla/banco,
 * escalón o toalla sí cuentan; cualquier otro aparato lo manda a "Gimnasio".
 *
 * Lo usan el script de importación y el test de invariantes de exercises.json.
 */

const APPARATUS = new RegExp(
  '\\b(' +
    [
      'bands?', 'roller', 'rollerout', 'wheel', 'rings?', 'suspended', 'suspension', 'straps',
      'pull[- ]?ups?', 'chin[- ]?ups?', 'chin', 'muscle[- ]?ups?', 'hanging', 'levers?', 'flag',
      'skin the cat', 'inverted row', 'captains?', 'parallel bars', 'cage', 'machine', 'cable',
      'pulldown', 'balance board', 'glute-ham', 'equipment',
    ].join('|') +
    ')\\b',
  'i'
);

/** Los fondos en paralelas o anillas necesitan aparato; los de banco o suelo, no */
const DIP = /\bdips?\b/i;
const HOUSEHOLD_DIP = /\b(bench|benches|floor)\b/i;

export function needsApparatus(name: string): boolean {
  if (APPARATUS.test(name)) return true;
  return DIP.test(name) && !HOUSEHOLD_DIP.test(name);
}

/**
 * Ejercicios que el dataset asigna a un músculo que no es el principal.
 * Sin ellos, "Sin material" se queda sin ejercicios reales de hombro.
 */
export const TARGET_OVERRIDES: Record<string, { target_muscle: string; split_category: 'tren_superior' | 'tren_inferior' | 'ambos' }> = {
  'handstand push-up': { target_muscle: 'Hombros', split_category: 'tren_superior' },
  'handstand': { target_muscle: 'Hombros', split_category: 'tren_superior' },
  'pike-to-cobra push-up': { target_muscle: 'Hombros', split_category: 'tren_superior' },
};
