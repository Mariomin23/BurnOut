import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';
const EXERCISES_URL = `${GITHUB_RAW_BASE}/data/exercises.json`;
const OUTPUT_PATH = path.resolve(__dirname, '../data/exercises.json');

interface GithubExercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  instructions: Record<string, string>;
  image: string;
  gif_url: string;
}

// Maps dataset body_part to our split_category
const SPLIT_MAP: Record<string, string> = {
  back: 'tren_superior',
  chest: 'tren_superior',
  shoulders: 'tren_superior',
  'upper arms': 'tren_superior',
  'lower arms': 'tren_superior',
  neck: 'tren_superior',
  'upper legs': 'tren_inferior',
  'lower legs': 'tren_inferior',
  waist: 'ambos',
  cardio: 'ambos',
};

// Base weight_factor by body_part (overridden to 0 for bodyweight equipment)
const WEIGHT_FACTOR_MAP: Record<string, number> = {
  chest: 1.0,
  back: 0.8,
  'upper legs': 1.2,
  'lower legs': 0.6,
  shoulders: 0.5,
  'upper arms': 0.4,
  'lower arms': 0.2,
  neck: 0.1,
  waist: 0,
  cardio: 0,
};

// Maps dataset target to Spanish names that routineService.ts filters expect.
// CRITICAL: these must match exactly the strings in routineService.ts generateRoutine().
const TARGET_MUSCLE_MAP: Record<string, string> = {
  abs: 'Core',
  adductors: 'Femorales',
  biceps: 'Bíceps',
  calves: 'Gemelos',
  'cardiovascular system': 'Cardio',
  delts: 'Hombros',
  forearms: 'Antebrazos',
  glutes: 'Glúteos',
  hamstrings: 'Femorales',
  lats: 'Espalda',
  'levator scapulae': 'Espalda',
  pectorals: 'Pecho',
  quads: 'Cuádriceps',
  'serratus anterior': 'Espalda',
  spine: 'Core',
  traps: 'Espalda',
  triceps: 'Tríceps',
  'upper back': 'Espalda',
  'hip flexors': 'Core',
  neck: 'Cuello',
  abductors: 'Glúteos',
};

// Equipment values that map to 'none' (no gym required)
const BODYWEIGHT_EQUIPMENT = new Set([
  'body weight',
  'band',
  'resistance band',
  'roller',
]);

function mapExercise(ex: GithubExercise) {
  const isBodyweight = BODYWEIGHT_EQUIPMENT.has(ex.equipment);
  return {
    id: ex.id,
    name: ex.name,
    target_muscle: TARGET_MUSCLE_MAP[ex.target] ?? ex.target,
    split_category: SPLIT_MAP[ex.body_part] ?? 'ambos',
    difficulty: 'intermediate',
    description: ex.instructions['es'] ?? ex.instructions['en'] ?? '',
    weight_factor: isBodyweight ? 0 : (WEIGHT_FACTOR_MAP[ex.body_part] ?? 0),
    equipment: isBodyweight ? 'none' : 'gym',
    gif_url: `${GITHUB_RAW_BASE}/${ex.gif_url}`,
    image_url: `${GITHUB_RAW_BASE}/${ex.image}`,
  };
}

function fetchJson(url: string): Promise<GithubExercise[]> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Descargando ejercicios desde GitHub...');
  const raw = await fetchJson(EXERCISES_URL);
  console.log(`Descargados ${raw.length} ejercicios.`);

  const mapped = raw.map(mapExercise);

  const bySplit = mapped.reduce((acc, ex) => {
    acc[ex.split_category] = (acc[ex.split_category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byEquipment = mapped.reduce((acc, ex) => {
    acc[ex.equipment] = (acc[ex.equipment] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byMuscle = mapped.reduce((acc, ex) => {
    acc[ex.target_muscle] = (acc[ex.target_muscle] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nSplit distribution:');
  Object.entries(bySplit).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nEquipment distribution:');
  Object.entries(byEquipment).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nMuscle distribution (top 15):');
  Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapped, null, 2), 'utf-8');
  console.log(`\n✅ ${mapped.length} ejercicios escritos en ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
