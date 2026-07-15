# Fase 3 — GIFs + Dataset GitHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 150 exercises (no GIFs) with 1,324 exercises from `hasaneyldrm/exercises-dataset`, each with an animated GIF displayed in the exercise card header.

**Architecture:** A one-time import script downloads the GitHub JSON, maps it to our Exercise schema (with Spanish target_muscle names that match `routineService.ts` filters), and writes a new `exercises.json`. The seed is updated to clean-sync MongoDB (deleting stale IDs). The frontend `ExerciseCard` gains a lazy-loaded 90×90 GIF in the header. No changes to `routineService.ts` needed — the muscle name mapping in the import script handles alignment.

**Tech Stack:** TypeScript, Node.js built-in `https`, React, CSS (App.css)

---

## File Map

| File | Change |
|------|--------|
| `backend/src/types/index.ts` | Add `gif_url?: string`, `image_url?: string` to `Exercise` |
| `backend/src/models/exercise.model.ts` | Add optional `gif_url`, `image_url` fields |
| `backend/src/scripts/importGithubExercises.ts` | **CREATE** — download + map script |
| `backend/src/data/exercises.json` | Replace with 1,324 mapped exercises (output of script) |
| `backend/src/db/seed.ts` | Add stale-exercise cleanup after upsert |
| `frontend/src/types/index.ts` | Add `gif_url?: string`, `image_url?: string` to `Exercise` |
| `frontend/src/components/ExerciseCard.tsx` | Add GIF `<img>` in header |
| `frontend/src/components/ExerciseCardSkeleton.tsx` | Add shimmer GIF placeholder |
| `frontend/src/App.css` | Add `.exercise-card__gif` rule |

---

## Critical Mapping Note

`routineService.ts` filters exercises by exact Spanish strings. The import script's `TARGET_MUSCLE_MAP` must produce these values:

| dataset `target` | our `target_muscle` | used in routineService filter |
|-----------------|---------------------|-------------------------------|
| pectorals | `Pecho` | ✓ Tren Superior, Full Body |
| lats | `Espalda` | ✓ Tren Superior, Full Body |
| upper back | `Espalda` | ✓ merged into same pool |
| traps | `Espalda` | ✓ merged into same pool |
| serratus anterior | `Espalda` | ✓ merged into same pool |
| levator scapulae | `Espalda` | ✓ merged into same pool |
| delts | `Hombros` | ✓ Tren Superior |
| biceps | `Bíceps` | ✓ Tren Superior |
| triceps | `Tríceps` | ✓ Tren Superior |
| quads | `Cuádriceps` | ✓ Tren Inferior, Full Body |
| hamstrings | `Femorales` | ✓ Tren Inferior, Full Body |
| adductors | `Femorales` | merged into same pool |
| glutes | `Glúteos` | ✓ Tren Inferior |
| calves | `Gemelos` | ✓ Tren Inferior |
| abs | `Core` | ✓ Full Body |
| spine | `Core` | merged into same pool |
| hip flexors | `Core` | merged into same pool |
| cardiovascular system | `Cardio` | falls to extras pool |
| forearms | `Antebrazos` | falls to extras pool |
| neck | `Cuello` | falls to extras pool |

---

## Task 1 — Add gif_url / image_url to Exercise interfaces and model

**Files:**
- Modify: `backend/src/types/index.ts`
- Modify: `backend/src/models/exercise.model.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Update backend Exercise interface**

In `backend/src/types/index.ts`, change the `Exercise` interface to:

```typescript
export interface Exercise {
  id: string;
  name: string;
  target_muscle: string;
  split_category: SplitCategory;
  difficulty: Difficulty;
  description: string;
  weight_factor: number;
  equipment: EquipmentCategory;
  gif_url?: string;
  image_url?: string;
}
```

- [ ] **Step 2: Update Mongoose exercise model**

Replace the full content of `backend/src/models/exercise.model.ts`:

```typescript
import { Schema, model } from 'mongoose';
import { Exercise } from '../types';

const exerciseSchema = new Schema<Exercise>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    target_muscle: { type: String, required: true },
    split_category: { type: String, required: true, enum: ['tren_superior', 'tren_inferior', 'ambos'] },
    difficulty: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
    description: { type: String, required: true },
    weight_factor: { type: Number, required: true, min: 0 },
    equipment: { type: String, required: true, enum: ['gym', 'none'] },
    gif_url: { type: String },
    image_url: { type: String },
  },
  { versionKey: false }
);

export const ExerciseModel = model<Exercise>('Exercise', exerciseSchema);
```

- [ ] **Step 3: Update frontend Exercise interface**

In `frontend/src/types/index.ts`, change the `Exercise` interface to:

```typescript
export interface Exercise {
  id: string;
  name: string;
  target_muscle: string;
  split_category: SplitCategory;
  difficulty: Difficulty;
  description: string;
  weight_factor: number;
  equipment: EquipmentCategory;
  gif_url?: string;
  image_url?: string;
}
```

- [ ] **Step 4: Verify TypeScript compiles (both)**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend" && npx tsc --noEmit && echo "backend OK"
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend" && npx tsc --noEmit && echo "frontend OK"
```

Expected: both print OK, zero errors.

- [ ] **Step 5: Commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add backend/src/types/index.ts backend/src/models/exercise.model.ts frontend/src/types/index.ts
git commit -m "feat(types): add gif_url and image_url to Exercise interface and model"
```

---

## Task 2 — Write the GitHub import script

**Files:**
- Create: `backend/src/scripts/importGithubExercises.ts`

- [ ] **Step 1: Create the script**

Create `backend/src/scripts/importGithubExercises.ts` with this exact content:

```typescript
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
```

- [ ] **Step 2: Check ts-node is available**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend" && npx ts-node --version
```

Expected: prints a version string (e.g., `v10.x.x`). If not found, install: `npm install --save-dev ts-node`.

- [ ] **Step 3: Run the import script**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend" && npx ts-node src/scripts/importGithubExercises.ts
```

Expected output:
```
Descargando ejercicios desde GitHub...
Descargados 1324 ejercicios.

Split distribution:
  ambos: ~240
  tren_inferior: ~320
  tren_superior: ~764

Equipment distribution:
  gym: ~950
  none: ~374

Muscle distribution (top 15):
  Espalda: ...
  Cuádriceps: ...
  ...

✅ 1324 ejercicios escritos en .../exercises.json
```

(Numbers are approximate — what matters is total 1324 and no errors.)

- [ ] **Step 4: Spot-check exercises.json**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
node -e "
const d = require('./src/data/exercises.json');
console.log('Total:', d.length);
const sample = d[0];
console.log('Sample ID:', sample.id);
console.log('Sample gif_url:', sample.gif_url);
console.log('Sample split_category:', sample.split_category);
console.log('Sample target_muscle:', sample.target_muscle);
console.log('Sample equipment:', sample.equipment);
console.log('Has description:', !!sample.description);
"
```

Expected: total 1324, gif_url starts with `https://raw.githubusercontent.com/hasaneyldrm/`, split_category is one of the three valid values.

- [ ] **Step 5: Verify no target_muscle falls through as English**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend"
node -e "
const d = require('./src/data/exercises.json');
const known = new Set(['Pecho','Espalda','Hombros','Bíceps','Tríceps','Cuádriceps','Femorales','Glúteos','Gemelos','Core','Cardio','Antebrazos','Cuello']);
const unknown = [...new Set(d.map(e => e.target_muscle))].filter(m => !known.has(m));
console.log('Unknown target_muscles:', unknown);
"
```

Expected: `Unknown target_muscles: []` (empty array). If any appear, add them to `TARGET_MUSCLE_MAP` in the script and re-run Step 3.

- [ ] **Step 6: Commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add backend/src/scripts/importGithubExercises.ts backend/src/data/exercises.json
git commit -m "feat(data): import 1324 exercises with GIFs from hasaneyldrm/exercises-dataset"
```

---

## Task 3 — Update seed to clean-sync (remove stale exercises from MongoDB)

**Files:**
- Modify: `backend/src/db/seed.ts`

- [ ] **Step 1: Update seed.ts**

Replace the full content of `backend/src/db/seed.ts`:

```typescript
import { Exercise } from '../types';
import { ExerciseModel } from '../models/exercise.model';
import exercisesData from '../data/exercises.json';

/**
 * Sincroniza exercises.json (fuente de verdad) con MongoDB:
 * 1. Upserts todos los ejercicios del JSON.
 * 2. Elimina de la DB cualquier ejercicio cuyo ID no esté en el JSON
 *    (limpia ejercicios obsoletos de versiones anteriores).
 */
export async function syncExercisesToDb(): Promise<number> {
  const exercises = exercisesData as Exercise[];
  const currentIds = exercises.map(e => e.id);

  await ExerciseModel.bulkWrite(
    exercises.map(exercise => ({
      updateOne: {
        filter: { id: exercise.id },
        update: { $set: exercise },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const deleted = await ExerciseModel.deleteMany({ id: { $nin: currentIds } });
  if (deleted.deletedCount > 0) {
    console.log(`Eliminados ${deleted.deletedCount} ejercicios obsoletos de MongoDB`);
  }

  const total = await ExerciseModel.countDocuments();
  console.log(`Ejercicios en DB: ${total}`);
  return total;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend" && npx tsc --noEmit && echo "OK"
```

Expected: prints OK, zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add backend/src/db/seed.ts
git commit -m "feat(seed): clean-sync — remove stale exercises from MongoDB on startup"
```

---

## Task 4 — Update ExerciseCard to display GIF

**Files:**
- Modify: `frontend/src/components/ExerciseCard.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Add GIF element to ExerciseCard header**

In `frontend/src/components/ExerciseCard.tsx`, insert the GIF `<img>` between the `exercise-card__info` div and the `exercise-card__actions` div. The updated header section (inside the outer `<div className="exercise-card__header"...>`) becomes:

```tsx
<div className="exercise-card__header" onClick={() => setIsExpanded(!isExpanded)}>
  <div className="exercise-card__info">
    <div className="exercise-card__badges">
      <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
        {exercise.target_muscle}
      </span>
      {exercise.equipment === 'none' && (
        <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }} title="No requiere material de gimnasio">
          Sin material
        </span>
      )}
      {item.progressionDirection && (
        <span
          className={`badge-pill progression-badge progression-badge--${item.progressionDirection}`}
          style={{ fontSize: '0.65rem' }}
          title={
            item.progressionDirection === 'up' ? 'Progresión: sube el peso'
            : item.progressionDirection === 'down' ? 'Descarga: baja el peso'
            : 'Consolida: mismo peso, busca más reps'
          }
        >
          {item.progressionDirection === 'up' ? '↑ Progresa'
            : item.progressionDirection === 'down' ? '↓ Descarga'
            : '= Consolida'}
        </span>
      )}
    </div>
    <h3 className="exercise-card__name">{exercise.name}</h3>
  </div>

  {exercise.gif_url && (
    <img
      src={exercise.gif_url}
      loading="lazy"
      alt=""
      aria-hidden="true"
      className="exercise-card__gif"
    />
  )}

  <div className="exercise-card__actions" onClick={e => e.stopPropagation()}>
    <button
      className="btn btn-secondary btn-circle"
      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={openVideoSearch}
      title="Buscar vídeo técnico en YouTube"
      aria-label="Buscar vídeo técnico en YouTube"
    >
      <svg width="20" height="14" viewBox="0 0 28.57 20" role="img" aria-hidden="true">
        <path
          fill="#FF0000"
          d="M27.973 3.123A3.578 3.578 0 0 0 25.447.597C23.22 0 14.285 0 14.285 0S5.35 0 3.123.597A3.578 3.578 0 0 0 .597 3.123C0 5.35 0 10 0 10s0 4.65.597 6.877a3.578 3.578 0 0 0 2.526 2.526C5.35 20 14.285 20 14.285 20s8.935 0 11.162-.597a3.578 3.578 0 0 0 2.526-2.526C28.57 14.65 28.57 10 28.57 10s0-4.65-.597-6.877z"
        />
        <path fill="#fff" d="M11.428 14.285 18.856 10l-7.428-4.285z" />
      </svg>
    </button>
    {showFavoriteButton && (
      <button
        className="btn btn-secondary btn-circle"
        style={{ width: '32px', height: '32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => onToggleFavorite?.(exercise.id)}
        title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>
    )}
    <button
      className="btn btn-primary btn-circle"
      style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
      onClick={() => onReroll(exercise.id, exercise.target_muscle)}
      disabled={isRerolling}
      title="Cambiar ejercicio (Re-roll)"
    >
      {isRerolling ? '⏳' : '🔄'}
    </button>
  </div>
</div>
```

- [ ] **Step 2: Add CSS for GIF**

In `frontend/src/App.css`, add near the other `.exercise-card__` rules:

```css
.exercise-card__gif {
  width: 90px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  align-self: center;
}

@media (max-width: 360px) {
  .exercise-card__gif {
    display: none;
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend" && npx tsc --noEmit && echo "OK"
```

Expected: prints OK, zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add frontend/src/components/ExerciseCard.tsx frontend/src/App.css
git commit -m "feat(ui): show animated GIF in exercise card header"
```

---

## Task 5 — Update ExerciseCardSkeleton with GIF placeholder

**Files:**
- Modify: `frontend/src/components/ExerciseCardSkeleton.tsx`

- [ ] **Step 1: Update skeleton header to include GIF shimmer**

The current header in `ExerciseCardSkeleton.tsx` has two `skeleton-line` divs (badges + name). Add a flex wrapper around the header content and insert a square shimmer block to mirror the GIF position.

Replace the full content of `frontend/src/components/ExerciseCardSkeleton.tsx`:

```tsx
import React from 'react';

export const ExerciseCardSkeleton: React.FC = () => {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Card header */}
      <div
        style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer skeleton-line skeleton-line--short" style={{ marginBottom: '0.5rem' }} />
          <div className="skeleton-shimmer skeleton-line skeleton-line--medium" />
        </div>
        {/* GIF placeholder */}
        <div
          className="skeleton-shimmer"
          style={{ width: '90px', height: '90px', borderRadius: '8px', flexShrink: 0 }}
        />
      </div>

      {/* Card body */}
      <div style={{ padding: '1.25rem' }}>
        <div className="skeleton-shimmer skeleton-line skeleton-line--full" style={{ marginBottom: '1.25rem' }} />

        {/* Set rows */}
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend" && npx tsc --noEmit && echo "OK"
```

Expected: prints OK, zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add frontend/src/components/ExerciseCardSkeleton.tsx
git commit -m "feat(ui): add GIF shimmer placeholder to exercise card skeleton"
```

---

## Task 6 — End-to-end verification

- [ ] **Step 1: Start backend in dev mode**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/backend" && npm run dev
```

Watch the startup log. Expected lines:
```
Eliminados N ejercicios obsoletos de MongoDB   ← only on first run with old data
Ejercicios en DB: 1324
```

- [ ] **Step 2: Start frontend in dev mode**

In a second terminal:

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend" && npm run dev
```

- [ ] **Step 3: Generate a routine — verify GIFs load**

Open the app in browser. Fill in the profile form and generate a routine. Verify:
- Each exercise card shows a 90×90 animated GIF in the header between the name and the action buttons
- GIFs animate
- Cards with `equipment: none` show "Sin material" badge
- Card header still collapses/expands on click
- Reroll button works and the replacement exercise also shows a GIF
- YouTube button still opens search

- [ ] **Step 4: Test mobile viewport**

In DevTools, set viewport to 375px. Verify GIFs display and don't break layout.
Set viewport to 350px. Verify GIFs are hidden (media query).

- [ ] **Step 5: Production build**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut/frontend" && npm run build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 6: Update contextburn.md**

Add completion note to the `## FASE 3 ##` section:

```
> ✅ COMPLETADO (2026-07-15): 1,324 ejercicios con GIF animado importados de hasaneyldrm/exercises-dataset. GIF 90×90 en header de ExerciseCard, lazy-loaded. Mapeo body_part→split_category y target→target_muscle alineado con routineService.ts. Seed limpia ejercicios obsoletos de MongoDB en cada deploy.
```

- [ ] **Step 7: Final commit**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut"
git add contextburn.md
git commit -m "docs: mark Fase 3 complete in contextburn.md"
```
