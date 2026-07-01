# Fase 2A — Progresión Automática + Historial: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El sistema guarda el historial de workouts en localStorage y el backend sugiere pesos/reps por doble progresión + RPE usando un resumen del historial enviado en cada request.

**Architecture:** Frontend persiste `WorkoutLog[]` en localStorage (`fit_poke_history_v1`) y adjunta un resumen compacto (última sesión por ejercicio, máx. 30) a `/generate` y `/reroll`. El backend añade `ProgressionService` (puro) que decide peso/reps por ejercicio, y `RoutineService` sesga la selección 70/30 hacia ejercicios con historial. Sin historial → fórmula actual de peso corporal.

**Tech Stack:** Express + Zod + TypeScript (backend), React + Vite + TypeScript (frontend), Vitest (tests, nuevo), Playwright (e2e manual).

**Spec:** `docs/superpowers/specs/2026-07-02-fase-2a-progresion-design.md`

**Convenciones del repo:** commits Conventional Commits terminados en `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Rutas relativas a la raíz del repo. El directorio del proyecto contiene un espacio (`proyectos personales`) — citar rutas en shell.

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|---|---|---|
| Modify | `backend/package.json` | dep dev `vitest` + script `test` |
| Modify | `backend/tsconfig.json` | excluir `*.test.ts` del build |
| Modify | `backend/src/types/index.ts` | tipos de historial + `progressionDirection` + `GoalLabel` |
| Create | `backend/src/services/progressionService.ts` | reglas de doble progresión (puro) + `GOAL_REP_RANGE` |
| Create | `backend/src/services/progressionService.test.ts` | unit tests progresión |
| Modify | `backend/src/schemas/userProfile.schema.ts` | `HistorySchema` |
| Create | `backend/src/schemas/history.schema.test.ts` | unit tests del schema |
| Modify | `backend/src/services/routineService.ts` | sesgo 70/30, integrar prescripción, quitar reps fijos |
| Create | `backend/src/services/routineService.test.ts` | tests de integración selección+prescripción |
| Modify | `backend/src/controllers/routineController.ts` | parse tolerante de `history` |
| Modify | `frontend/package.json` | dep dev `vitest` + script `test` |
| Modify | `frontend/src/types/index.ts` | tipos de historial + `progressionDirection` |
| Create | `frontend/src/lib/history.ts` | lógica pura de historial (log, cap, resumen) |
| Create | `frontend/src/lib/history.test.ts` | unit tests lógica pura |
| Create | `frontend/src/hooks/useHistory.ts` | wrapper con estado + localStorage |
| Modify | `frontend/src/hooks/useWorkout.ts` | guardar workout + enviar resumen |
| Modify | `frontend/src/components/ExerciseCard.tsx` | badge ↑/=/↓ |
| Modify | `frontend/src/App.css` | estilos del badge |

---

### Task 1: Vitest en backend + tipos nuevos

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/tsconfig.json`
- Modify: `backend/src/types/index.ts`

- [ ] **Step 1: Instalar Vitest**

```bash
cd backend && npm install -D vitest
```

- [ ] **Step 2: Añadir script de test a `backend/package.json`**

En `"scripts"`, añadir:

```json
"test": "vitest run"
```

- [ ] **Step 3: Excluir tests del build en `backend/tsconfig.json`**

Añadir tras `"include"`:

```json
"exclude": ["src/**/*.test.ts"]
```

- [ ] **Step 4: Añadir tipos a `backend/src/types/index.ts`**

Añadir al final del archivo:

```ts
export type GoalLabel = 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';

export type ProgressionDirection = 'up' | 'keep' | 'down';

export interface ExerciseSetLog {
  weightKg: number;
  reps: number;
  rpe: number;
}

export interface ExerciseHistorySummary {
  exerciseId: string;
  lastSession: {
    date: string;
    goal: GoalLabel;
    sets: ExerciseSetLog[];
  };
}
```

Y en la interfaz `WorkoutExercise` existente, añadir el campo opcional:

```ts
export interface WorkoutExercise {
  exercise: Exercise;
  sets: RoutineSet[];
  restTimerSeconds: number;
  progressionDirection?: ProgressionDirection;
}
```

- [ ] **Step 5: Verificar que compila**

```bash
cd backend && npm run build
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/src/types/index.ts
git commit -m "chore(backend): add vitest and history types for Fase 2A

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `ProgressionService` (TDD)

**Files:**
- Create: `backend/src/services/progressionService.ts`
- Create: `backend/src/services/progressionService.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `backend/src/services/progressionService.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ProgressionService, GOAL_REP_RANGE } from './progressionService';
import { Exercise, ExerciseSetLog } from '../types';

const svc = new ProgressionService();

const barbell: Exercise = {
  id: 'ex-1', name: 'Press de Banca con Barra', target_muscle: 'Pecho',
  split_category: 'tren_superior', difficulty: 'intermediate',
  description: '', weight_factor: 1.0,
};
const heavy: Exercise = { ...barbell, id: 'ex-2', name: 'Prensa de Piernas 45°', weight_factor: 1.8 };
const bodyweight: Exercise = { ...barbell, id: 'ex-3', name: 'Dominadas Pronas', weight_factor: 0 };

const sets = (entries: Array<[number, number, number]>): ExerciseSetLog[] =>
  entries.map(([weightKg, reps, rpe]) => ({ weightKg, reps, rpe }));

const session = (goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo', s: ExerciseSetLog[]) =>
  ({ date: '2026-07-01T10:00:00.000Z', goal, sets: s });

describe('GOAL_REP_RANGE', () => {
  it('define los rangos del spec', () => {
    expect(GOAL_REP_RANGE['Perder Peso']).toEqual({ min: 12, max: 15 });
    expect(GOAL_REP_RANGE['Volumen']).toEqual({ min: 8, max: 12 });
    expect(GOAL_REP_RANGE['Mantenerse Activo']).toEqual({ min: 10, max: 12 });
  });
});

describe('prescribe — fallback', () => {
  it('sin historial usa el peso fallback y el mínimo del rango, sin dirección', () => {
    const p = svc.prescribe(barbell, 'Volumen', undefined, 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 8 });
  });

  it('sesión sin series completadas equivale a sin historial', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', []), 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 8 });
  });
});

describe('prescribe — autocarga (weight_factor 0)', () => {
  it('progresa +1 rep sobre la mejor marca', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 10, 8], [0, 8, 9]])), 0);
    expect(p).toEqual({ suggestedWeightKg: 0, suggestedReps: 11, direction: 'keep' });
  });

  it('capa las reps al tope del rango', () => {
    const p = svc.prescribe(bodyweight, 'Volumen', session('Volumen', sets([[0, 12, 8]])), 0);
    expect(p.suggestedReps).toBe(12);
  });
});

describe('prescribe — subir peso', () => {
  it('todas las series al tope con RPE medio ≤ 8 → +2.5kg y reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 12, 8], [40, 12, 7]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 42.5, suggestedReps: 8, direction: 'up' });
  });

  it('weight_factor ≥ 1.2 sube 5kg', () => {
    const p = svc.prescribe(heavy, 'Volumen', session('Volumen', sets([[100, 12, 7], [100, 12, 7]])), 100);
    expect(p.suggestedWeightKg).toBe(105);
    expect(p.direction).toBe('up');
  });

  it('redondea a múltiplos de 2.5 tras el incremento', () => {
    // ref 41 + 2.5 = 43.5 → 42.5
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[41, 12, 7]])), 40);
    expect(p.suggestedWeightKg).toBe(42.5);
  });

  it('no sube si el RPE medio supera 8 aunque llegue al tope', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 9], [40, 12, 9]])), 40);
    expect(p.direction).not.toBe('up');
  });
});

describe('prescribe — bajar peso', () => {
  it('alguna serie bajo el mínimo del rango → −2.5kg, reps al mínimo', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 6, 9]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 37.5, suggestedReps: 8, direction: 'down' });
  });

  it('RPE medio ≥ 9.5 → baja aunque las reps estén en rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 10], [40, 9, 9]])), 40);
    expect(p.direction).toBe('down');
  });

  it('suelo de 2.5kg', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[2.5, 6, 10]])), 2.5);
    expect(p.suggestedWeightKg).toBe(2.5);
  });
});

describe('prescribe — mantener', () => {
  it('dentro del rango → mismo peso y mejor marca + 1', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 10, 8], [40, 9, 8]])), 40);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 11, direction: 'keep' });
  });

  it('capa la sugerencia de reps al tope del rango', () => {
    const p = svc.prescribe(barbell, 'Volumen', session('Volumen', sets([[40, 12, 8], [40, 9, 8]])), 40);
    expect(p.suggestedReps).toBe(12);
  });
});

describe('prescribe — cambio de objetivo', () => {
  it('conserva el peso de referencia y resetea reps al rango nuevo', () => {
    const p = svc.prescribe(barbell, 'Perder Peso', session('Volumen', sets([[40, 12, 7], [40, 12, 7]])), 30);
    expect(p).toEqual({ suggestedWeightKg: 40, suggestedReps: 12, direction: 'keep' });
  });
});
```

- [ ] **Step 2: Verificar que fallan**

```bash
cd backend && npm test
```

Expected: FAIL — `Cannot find module './progressionService'`.

- [ ] **Step 3: Implementar `backend/src/services/progressionService.ts`**

```ts
import { Exercise, ExerciseHistorySummary, GoalLabel, ProgressionDirection } from '../types';

export const GOAL_REP_RANGE: Record<GoalLabel, { min: number; max: number }> = {
  'Perder Peso': { min: 12, max: 15 },
  'Volumen': { min: 8, max: 12 },
  'Mantenerse Activo': { min: 10, max: 12 },
};

export interface Prescription {
  suggestedWeightKg: number;
  suggestedReps: number;
  direction?: ProgressionDirection;
}

export class ProgressionService {
  public prescribe(
    exercise: Exercise,
    goal: GoalLabel,
    lastSession: ExerciseHistorySummary['lastSession'] | undefined,
    fallbackWeightKg: number
  ): Prescription {
    const range = GOAL_REP_RANGE[goal];

    if (!lastSession || lastSession.sets.length === 0) {
      return { suggestedWeightKg: fallbackWeightKg, suggestedReps: range.min };
    }

    const loadFactor = exercise.weight_factor ?? 1;
    const bestReps = Math.max(...lastSession.sets.map(s => s.reps));

    if (loadFactor === 0) {
      return {
        suggestedWeightKg: 0,
        suggestedReps: Math.min(range.max, bestReps + 1),
        direction: 'keep',
      };
    }

    const refWeight = Math.max(...lastSession.sets.map(s => s.weightKg));

    if (lastSession.goal !== goal) {
      return { suggestedWeightKg: this.round(refWeight), suggestedReps: range.min, direction: 'keep' };
    }

    const increment = loadFactor >= 1.2 ? 5 : 2.5;
    const avgRpe = lastSession.sets.reduce((sum, s) => sum + s.rpe, 0) / lastSession.sets.length;
    const allAtTop = lastSession.sets.every(s => s.reps >= range.max);
    const anyBelowMin = lastSession.sets.some(s => s.reps < range.min);

    if (allAtTop && avgRpe <= 8) {
      return { suggestedWeightKg: this.round(refWeight + increment), suggestedReps: range.min, direction: 'up' };
    }

    if (anyBelowMin || avgRpe >= 9.5) {
      return { suggestedWeightKg: this.round(refWeight - increment), suggestedReps: range.min, direction: 'down' };
    }

    return {
      suggestedWeightKg: this.round(refWeight),
      suggestedReps: Math.min(range.max, bestReps + 1),
      direction: 'keep',
    };
  }

  private round(weightKg: number): number {
    return Math.max(Math.round(weightKg / 2.5) * 2.5, 2.5);
  }
}
```

- [ ] **Step 4: Verificar que pasan**

```bash
cd backend && npm test
```

Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/progressionService.ts backend/src/services/progressionService.test.ts
git commit -m "feat(backend): add ProgressionService with double progression rules

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `HistorySchema` en Zod (TDD)

**Files:**
- Modify: `backend/src/schemas/userProfile.schema.ts`
- Create: `backend/src/schemas/history.schema.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `backend/src/schemas/history.schema.test.ts`:

```ts
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
```

- [ ] **Step 2: Verificar que fallan**

```bash
cd backend && npm test
```

Expected: FAIL — `HistorySchema` no exportado.

- [ ] **Step 3: Añadir a `backend/src/schemas/userProfile.schema.ts`**

Añadir al final del archivo:

```ts
export const ExerciseSetLogSchema = z.object({
  weightKg: z.number().min(0).max(500),
  reps: z.number().int().min(0).max(100),
  rpe: z.number().min(1).max(10),
});

export const HistorySchema = z
  .array(
    z.object({
      exerciseId: z.string(),
      lastSession: z.object({
        date: z.string(),
        goal: z.enum(['Perder Peso', 'Volumen', 'Mantenerse Activo']),
        sets: z.array(ExerciseSetLogSchema).max(10),
      }),
    })
  )
  .max(30);
```

- [ ] **Step 4: Verificar que pasan**

```bash
cd backend && npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas/userProfile.schema.ts backend/src/schemas/history.schema.test.ts
git commit -m "feat(backend): add Zod schema for workout history payload

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Integración en `RoutineService` (sesgo 70/30 + prescripción)

**Files:**
- Modify: `backend/src/services/routineService.ts`
- Create: `backend/src/services/routineService.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `backend/src/services/routineService.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { RoutineService } from './routineService';
import { Exercise, ExerciseHistorySummary, UserProfile } from '../types';

const ex = (id: string, muscle: string, factor = 1.0): Exercise => ({
  id, name: `Ejercicio ${id}`, target_muscle: muscle,
  split_category: muscle === 'Core' ? 'ambos'
    : ['Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos'].includes(muscle) ? 'tren_inferior' : 'tren_superior',
  difficulty: 'intermediate', description: '', weight_factor: factor,
});

const catalog: Exercise[] = [
  ex('pecho-a', 'Pecho'), ex('pecho-b', 'Pecho'), ex('pecho-c', 'Pecho'),
  ex('espalda-a', 'Espalda'), ex('espalda-b', 'Espalda'), ex('espalda-c', 'Espalda'),
  ex('hombros-a', 'Hombros'), ex('hombros-b', 'Hombros'),
  ex('biceps-a', 'Bíceps'), ex('triceps-a', 'Tríceps'),
];

const repo = { getAll: async () => catalog };

const profile: UserProfile = {
  weightKg: 80, heightCm: 180, age: 30, sex: 'masculino',
  experience: 'intermediate', split: 'Tren Superior', goal: 'Volumen',
};

const historyFor = (exerciseId: string): ExerciseHistorySummary => ({
  exerciseId,
  lastSession: {
    date: '2026-07-01T10:00:00.000Z',
    goal: 'Volumen',
    sets: [
      { weightKg: 40, reps: 12, rpe: 7 },
      { weightKg: 40, reps: 12, rpe: 8 },
    ],
  },
});

describe('generateRoutine con historial', () => {
  it('con rng < 0.7 los huecos eligen ejercicios con historial', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-c'), historyFor('espalda-c')]);
    const ids = routine.exercises.map(e => e.exercise.id);
    expect(ids).toContain('pecho-c');
    expect(ids).toContain('espalda-c');
  });

  it('el ejercicio con historial al tope recibe subida de peso y direction up', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-c')]);
    const item = routine.exercises.find(e => e.exercise.id === 'pecho-c')!;
    expect(item.progressionDirection).toBe('up');
    expect(item.sets[0].suggestedWeightKg).toBe(42.5);
    expect(item.sets[0].suggestedReps).toBe(8); // mínimo del rango Volumen
  });

  it('ejercicios sin historial usan fallback sin progressionDirection y reps al mínimo del rango', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, []);
    for (const item of routine.exercises) {
      expect(item.progressionDirection).toBeUndefined();
      expect(item.sets[0].suggestedReps).toBe(8);
    }
  });

  it('no repite ejercicios aunque el historial cubra varios huecos del mismo músculo', async () => {
    const svc = new RoutineService(repo, () => 0);
    const routine = await svc.generateRoutine(profile, [historyFor('pecho-a'), historyFor('pecho-b')]);
    const ids = routine.exercises.map(e => e.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('rerollExercise con historial', () => {
  it('aplica prescripción si el ejercicio elegido tiene historial', async () => {
    const svc = new RoutineService(repo, () => 0);
    const result = await svc.rerollExercise(
      'Pecho',
      ['pecho-a', 'pecho-b'], // solo queda pecho-c
      profile,
      [historyFor('pecho-c')]
    );
    expect(result.exercise.id).toBe('pecho-c');
    expect(result.progressionDirection).toBe('up');
    expect(result.sets[0].suggestedWeightKg).toBe(42.5);
  });
});
```

- [ ] **Step 2: Verificar que fallan**

```bash
cd backend && npm test
```

Expected: FAIL — constructor no acepta rng / generateRoutine no acepta history.

- [ ] **Step 3: Modificar `backend/src/services/routineService.ts`**

3a. Imports y constructor — reemplazar la cabecera de la clase:

```ts
import { randomUUID } from 'crypto';
import { IExerciseRepository } from '../repositories/exerciseRepository';
import {
  Exercise,
  WorkoutRoutine,
  WorkoutExercise,
  RoutineSet,
  UserProfile,
  Difficulty,
  ExerciseHistorySummary,
} from '../types';
import { ProgressionService, GOAL_REP_RANGE } from './progressionService';

export class RoutineService {
  private progressionService = new ProgressionService();

  constructor(
    private exerciseRepository: IExerciseRepository,
    private rng: () => number = Math.random
  ) {}
```

(El import de `Sex` desaparece si queda sin uso.)

3b. Nuevo helper privado (junto a `shuffle`):

```ts
  /** Saca un ejercicio del pool; 70% de las veces prefiere uno con historial si lo hay. */
  private takeWithBias(pool: Exercise[], historyIds: Set<string>): Exercise | undefined {
    if (pool.length === 0) return undefined;
    const histIndex = pool.findIndex(e => historyIds.has(e.id));
    const index = histIndex >= 0 && this.rng() < 0.7 ? histIndex : 0;
    return pool.splice(index, 1)[0];
  }
```

`shuffle` pasa a usar `this.rng` en lugar de `Math.random`:

```ts
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
```

3c. Firma y selección en `generateRoutine` — la selección por split se reescribe con pools + huecos. Reemplazar desde la firma hasta el final del bloque de selección (`selectedExercises = selectedExercises.filter(Boolean).slice(0, 6);`):

```ts
  public async generateRoutine(
    profile: UserProfile,
    history: ExerciseHistorySummary[] = []
  ): Promise<WorkoutRoutine> {
    const rawExercises = await this.exerciseRepository.getAll();
    const allExercises = this.filterByDifficulty(rawExercises, profile.experience);
    const split = profile.split;
    const goal = profile.goal;
    const historyIds = new Set(history.map(h => h.exerciseId));
    const historyMap = new Map(history.map(h => [h.exerciseId, h.lastSession]));

    let selectedExercises: Exercise[] = [];

    if (split === 'Tren Superior') {
      const upperExs = allExercises.filter(e => e.split_category === 'tren_superior');
      const pecho = this.shuffle(upperExs.filter(e => e.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(e => e.target_muscle === 'Espalda'));
      const hombros = this.shuffle(upperExs.filter(e => e.target_muscle === 'Hombros'));
      const biceps = this.shuffle(upperExs.filter(e => e.target_muscle === 'Bíceps'));
      const triceps = this.shuffle(upperExs.filter(e => e.target_muscle === 'Tríceps'));

      // 2 Pecho, 2 Espalda, 1 Hombro, 1 Brazo (bíceps/tríceps al azar)
      const slots = [pecho, espalda, pecho, espalda, hombros, this.rng() > 0.5 ? biceps : triceps];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }
    } else if (split === 'Tren Inferior') {
      const lowerExs = allExercises.filter(e => e.split_category === 'tren_inferior');
      const cuadriceps = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Femorales'));
      const gluteos = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Glúteos'));
      const gemelos = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Gemelos'));

      // 2 Cuádriceps, 2 Femorales, 1 Glúteo, 1 Gemelos
      const slots = [cuadriceps, femorales, cuadriceps, femorales, gluteos, gemelos];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }
    } else {
      // Full Body
      const upperExs = allExercises.filter(e => e.split_category === 'tren_superior');
      const lowerExs = allExercises.filter(e => e.split_category === 'tren_inferior');
      const ambosExs = allExercises.filter(e => e.split_category === 'ambos');

      const pecho = this.shuffle(upperExs.filter(e => e.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(e => e.target_muscle === 'Espalda'));
      const cuadriceps = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Femorales'));
      const core = this.shuffle(ambosExs.filter(e => e.target_muscle === 'Core'));

      // 1 Pecho, 1 Cuádriceps, 1 Espalda, 1 Femorales, 1 Core, 1 compuesto extra
      const slots = [pecho, cuadriceps, espalda, femorales, core];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }

      const extraCompound = ambosExs.find(
        e => e.target_muscle !== 'Core' && !selectedExercises.some(s => s.id === e.id)
      );
      if (extraCompound) selectedExercises.push(extraCompound);
    }

    selectedExercises = selectedExercises.filter(Boolean).slice(0, 6);
```

3d. Sets y reps — reemplazar el bloque `numSets/targetReps/restTimerSeconds` y el map de `exercisesWithSets`:

```ts
    const numSets = goal === 'Volumen' ? 4 : 3;
    const restTimerSeconds = goal === 'Perder Peso' ? 60 : goal === 'Volumen' ? 120 : 90;

    const exercisesWithSets: WorkoutExercise[] = selectedExercises.map(exercise => {
      const fallbackWeight = this.calculateSuggestedWeight(exercise, profile);
      const prescription = this.progressionService.prescribe(
        exercise,
        goal,
        historyMap.get(exercise.id),
        fallbackWeight
      );
      const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
        setIndex: i + 1,
        suggestedReps: prescription.suggestedReps,
        suggestedWeightKg: prescription.suggestedWeightKg,
      }));

      return {
        exercise,
        sets,
        restTimerSeconds,
        ...(prescription.direction ? { progressionDirection: prescription.direction } : {}),
      };
    });
```

El resto de `generateRoutine` (warmup/cooldown/return) queda igual.

3e. `rerollExercise` — nueva firma y mismo patrón de prescripción. Reemplazar la firma y el bloque final (desde `// Determine sets, reps...` hasta el `return`):

```ts
  public async rerollExercise(
    targetMuscle: string,
    excludedIds: string[],
    profile: UserProfile,
    history: ExerciseHistorySummary[] = []
  ): Promise<WorkoutExercise> {
```

…(selección de candidatos sin cambios, 100% aleatoria; sustituir su `Math.random()` por `this.rng()`)…

```ts
    const numSets = profile.goal === 'Volumen' ? 4 : 3;
    const restTimerSeconds = profile.goal === 'Perder Peso' ? 60 : profile.goal === 'Volumen' ? 120 : 90;

    const historyMap = new Map(history.map(h => [h.exerciseId, h.lastSession]));
    const fallbackWeight = this.calculateSuggestedWeight(selectedExercise, profile);
    const prescription = this.progressionService.prescribe(
      selectedExercise,
      profile.goal,
      historyMap.get(selectedExercise.id),
      fallbackWeight
    );
    const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
      setIndex: i + 1,
      suggestedReps: prescription.suggestedReps,
      suggestedWeightKg: prescription.suggestedWeightKg,
    }));

    return {
      exercise: selectedExercise,
      sets,
      restTimerSeconds,
      ...(prescription.direction ? { progressionDirection: prescription.direction } : {}),
    };
  }
```

- [ ] **Step 4: Verificar tests y build**

```bash
cd backend && npm test && npm run build
```

Expected: PASS + build limpio. Ojo: los tests de Task 2 y 3 deben seguir pasando.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/routineService.ts backend/src/services/routineService.test.ts
git commit -m "feat(backend): apply progression and history bias in routine generation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Controller — parse tolerante de `history`

**Files:**
- Modify: `backend/src/controllers/routineController.ts`

- [ ] **Step 1: Modificar `generate` y `reroll`**

En `backend/src/controllers/routineController.ts`, importar `HistorySchema`:

```ts
import { UserProfileSchema, RerollRequestSchema, HistorySchema } from '../schemas/userProfile.schema';
```

Añadir helper privado en la clase:

```ts
  /** history inválido se ignora (nunca 400): los datos viejos del móvil no deben romper la generación */
  private parseHistory(raw: unknown) {
    if (raw === undefined) return [];
    const parsed = HistorySchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('Invalid history payload ignored');
      return [];
    }
    return parsed.data;
  }
```

En `generate`, tras validar el perfil:

```ts
      const history = this.parseHistory(req.body.history);
      const routine = await this.routineService.generateRoutine(result.data, history);
```

En `reroll`:

```ts
      const { targetMuscle, excludedIds, profile } = result.data;
      const history = this.parseHistory(req.body.history);
      const workoutExercise = await this.routineService.rerollExercise(targetMuscle, excludedIds, profile, history);
```

Nota: `UserProfileSchema` y `RerollRequestSchema` son `z.object` no estrictos — la clave extra `history` en el body no los rompe.

- [ ] **Step 2: Verificar build + tests + smoke manual**

```bash
cd backend && npm test && npm run build
```

Smoke con servidor local:

```bash
cd backend && npx ts-node src/server.ts &
sleep 3
curl -s -X POST http://localhost:5000/api/routines/generate -H 'Content-Type: application/json' \
  -d '{"weightKg":80,"heightCm":180,"age":30,"sex":"masculino","experience":"intermediate","split":"Tren Superior","goal":"Volumen","history":[{"exerciseId":"ex-101","lastSession":{"date":"2026-07-01T10:00:00.000Z","goal":"Volumen","sets":[{"weightKg":40,"reps":12,"rpe":7},{"weightKg":40,"reps":12,"rpe":7}]}}]}' \
  | python3 -m json.tool | grep -E '"name"|progressionDirection|suggestedWeightKg' | head -20
kill %1
```

Expected: si sale `Press de Banca con Barra` (ex-101), lleva `progressionDirection: "up"` y `suggestedWeightKg: 42.5`. Con `history` malformado (p. ej. `"history": "junk"`) responde 200 igualmente.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/routineController.ts
git commit -m "feat(backend): accept optional history payload in generate and reroll

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Frontend — tipos + lógica pura de historial (TDD)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/history.ts`
- Create: `frontend/src/lib/history.test.ts`

- [ ] **Step 1: Instalar Vitest**

```bash
cd frontend && npm install -D vitest
```

Añadir a `"scripts"` de `frontend/package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Añadir tipos a `frontend/src/types/index.ts`**

Añadir al final:

```ts
export type GoalLabel = 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';

export type ProgressionDirection = 'up' | 'keep' | 'down';

export interface ExerciseSetLog {
  weightKg: number;
  reps: number;
  rpe: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  sets: ExerciseSetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  split: 'Tren Superior' | 'Tren Inferior' | 'Full Body';
  goal: GoalLabel;
  totalVolumeKg: number;
  exercises: ExerciseLog[];
}

export interface ExerciseHistorySummary {
  exerciseId: string;
  lastSession: {
    date: string;
    goal: GoalLabel;
    sets: ExerciseSetLog[];
  };
}
```

Y en `WorkoutExercise`, añadir:

```ts
  progressionDirection?: ProgressionDirection;
```

- [ ] **Step 3: Escribir tests que fallan**

Crear `frontend/src/lib/history.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildWorkoutLog, appendToHistory, summarizeHistory } from './history';
import type { WorkoutRoutine, WorkoutLog } from '../types';

const routine = (overrides: Partial<WorkoutRoutine> = {}): WorkoutRoutine => ({
  id: 'r-1',
  split: 'Tren Superior',
  goal: 'Volumen',
  warmup: [],
  cooldown: [],
  createdAt: '2026-07-02T10:00:00.000Z',
  isCompleted: false,
  exercises: [
    {
      exercise: {
        id: 'ex-101', name: 'Press de Banca con Barra', target_muscle: 'Pecho',
        split_category: 'tren_superior', difficulty: 'intermediate', description: '',
      },
      restTimerSeconds: 120,
      sets: [
        { setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40, completed: true, completedReps: 10, completedWeightKg: 40, completedRpe: 8 },
        { setIndex: 2, suggestedReps: 8, suggestedWeightKg: 40, completed: false, completedReps: 5 },
      ],
    },
    {
      exercise: {
        id: 'ex-102', name: 'Remo con Barra', target_muscle: 'Espalda',
        split_category: 'tren_superior', difficulty: 'intermediate', description: '',
      },
      restTimerSeconds: 120,
      sets: [{ setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40 }],
    },
  ],
  ...overrides,
});

const log = (id: string, date: string, exerciseId = 'ex-101'): WorkoutLog => ({
  id, date, split: 'Tren Superior', goal: 'Volumen', totalVolumeKg: 400,
  exercises: [{ exerciseId, exerciseName: 'X', targetMuscle: 'Pecho', sets: [{ weightKg: 40, reps: 10, rpe: 8 }] }],
});

describe('buildWorkoutLog', () => {
  it('solo incluye series completed y descarta ejercicios sin ninguna', () => {
    const result = buildWorkoutLog(routine(), '2026-07-02T11:00:00.000Z')!;
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].sets).toEqual([{ weightKg: 40, reps: 10, rpe: 8 }]);
    expect(result.date).toBe('2026-07-02T11:00:00.000Z');
    expect(result.totalVolumeKg).toBe(400);
  });

  it('devuelve null si no hay ninguna serie completada', () => {
    const empty = routine();
    empty.exercises.forEach(e => e.sets.forEach(s => { s.completed = false; }));
    expect(buildWorkoutLog(empty, '2026-07-02T11:00:00.000Z')).toBeNull();
  });

  it('serie completada sin datos usa 0/0 y RPE 8', () => {
    const r = routine();
    r.exercises[0].sets = [{ setIndex: 1, suggestedReps: 8, suggestedWeightKg: 40, completed: true }];
    const result = buildWorkoutLog(r, '2026-07-02T11:00:00.000Z')!;
    expect(result.exercises[0].sets).toEqual([{ weightKg: 0, reps: 0, rpe: 8 }]);
  });
});

describe('appendToHistory', () => {
  it('añade al final y respeta el cap FIFO', () => {
    const history = Array.from({ length: 100 }, (_, i) => log(`w-${i}`, `2026-01-01T00:00:0${i % 10}.000Z`));
    const next = appendToHistory(history, log('w-new', '2026-07-02T11:00:00.000Z'), 100);
    expect(next).toHaveLength(100);
    expect(next[99].id).toBe('w-new');
    expect(next[0].id).toBe('w-1'); // el más antiguo cae
  });
});

describe('summarizeHistory', () => {
  it('devuelve la sesión más reciente por ejercicio', () => {
    const history = [
      log('w-1', '2026-06-01T10:00:00.000Z'),
      log('w-2', '2026-07-01T10:00:00.000Z'),
    ];
    const summary = summarizeHistory(history);
    expect(summary).toHaveLength(1);
    expect(summary[0].lastSession.date).toBe('2026-07-01T10:00:00.000Z');
  });

  it('capa a 30 ejercicios, priorizando los más recientes', () => {
    const history = Array.from({ length: 40 }, (_, i) =>
      log(`w-${i}`, `2026-06-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`, `ex-${i}`)
    );
    const summary = summarizeHistory(history, 30);
    expect(summary).toHaveLength(30);
    expect(summary.map(s => s.exerciseId)).toContain('ex-39'); // el último workout entra
  });
});
```

- [ ] **Step 4: Verificar que fallan**

```bash
cd frontend && npm test
```

Expected: FAIL — `Cannot find module './history'`.

- [ ] **Step 5: Implementar `frontend/src/lib/history.ts`**

```ts
import type {
  ExerciseHistorySummary,
  ExerciseLog,
  WorkoutLog,
  WorkoutRoutine,
} from '../types';

export const HISTORY_KEY = 'fit_poke_history_v1';
export const MAX_WORKOUTS = 100;
export const MAX_SUMMARY_EXERCISES = 30;

export function buildWorkoutLog(routine: WorkoutRoutine, date: string): WorkoutLog | null {
  const exercises: ExerciseLog[] = routine.exercises
    .map(item => ({
      exerciseId: item.exercise.id,
      exerciseName: item.exercise.name,
      targetMuscle: item.exercise.target_muscle,
      sets: item.sets
        .filter(s => s.completed)
        .map(s => ({
          weightKg: s.completedWeightKg ?? 0,
          reps: s.completedReps ?? 0,
          rpe: s.completedRpe ?? 8,
        })),
    }))
    .filter(e => e.sets.length > 0);

  if (exercises.length === 0) return null;

  const totalVolumeKg = exercises.reduce(
    (total, e) => total + e.sets.reduce((sub, s) => sub + s.weightKg * s.reps, 0),
    0
  );

  return {
    id: routine.id,
    date,
    split: routine.split,
    goal: routine.goal,
    totalVolumeKg,
    exercises,
  };
}

export function appendToHistory(
  history: WorkoutLog[],
  log: WorkoutLog,
  max: number = MAX_WORKOUTS
): WorkoutLog[] {
  return [...history, log].slice(-max);
}

export function summarizeHistory(
  history: WorkoutLog[],
  maxExercises: number = MAX_SUMMARY_EXERCISES
): ExerciseHistorySummary[] {
  const byExercise = new Map<string, ExerciseHistorySummary>();
  // Del más reciente al más antiguo: la primera aparición gana
  for (let i = history.length - 1; i >= 0 && byExercise.size < maxExercises; i--) {
    const workout = history[i];
    for (const exercise of workout.exercises) {
      if (byExercise.size >= maxExercises) break;
      if (byExercise.has(exercise.exerciseId)) continue;
      byExercise.set(exercise.exerciseId, {
        exerciseId: exercise.exerciseId,
        lastSession: { date: workout.date, goal: workout.goal, sets: exercise.sets },
      });
    }
  }
  return [...byExercise.values()];
}
```

- [ ] **Step 6: Verificar que pasan + build**

```bash
cd frontend && npm test && npm run build
```

Expected: PASS + build limpio.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/types/index.ts frontend/src/lib/history.ts frontend/src/lib/history.test.ts
git commit -m "feat(frontend): add workout history types and pure history logic

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `useHistory` + integración en `useWorkout`

**Files:**
- Create: `frontend/src/hooks/useHistory.ts`
- Modify: `frontend/src/hooks/useWorkout.ts`

- [ ] **Step 1: Crear `frontend/src/hooks/useHistory.ts`**

```ts
import { useCallback, useState } from 'react';
import type { ExerciseHistorySummary, WorkoutLog, WorkoutRoutine } from '../types';
import { HISTORY_KEY, appendToHistory, buildWorkoutLog, summarizeHistory } from '../lib/history';

export function useHistory() {
  const [history, setHistory] = useState<WorkoutLog[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const appendWorkout = useCallback((routine: WorkoutRoutine) => {
    const log = buildWorkoutLog(routine, new Date().toISOString());
    if (!log) return;
    setHistory(prev => {
      const next = appendToHistory(prev, log);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const buildSummary = useCallback(
    (): ExerciseHistorySummary[] => summarizeHistory(history),
    [history]
  );

  return { history, appendWorkout, buildSummary };
}
```

- [ ] **Step 2: Integrar en `frontend/src/hooks/useWorkout.ts`**

2a. Import y uso del hook — dentro de `useWorkout()`, antes de los `useState`:

```ts
import { useHistory } from './useHistory';
```

```ts
export function useWorkout() {
  const { history, appendWorkout, buildSummary } = useHistory();
```

2b. `handleGenerateRoutine` — el body pasa a incluir el resumen:

```ts
        body: JSON.stringify({ ...userProfile, history: buildSummary() }),
```

y `buildSummary` se añade al array de dependencias del `useCallback`:

```ts
  }, [persistRoutine, buildSummary]);
```

2c. `handleRerollExercise` — ídem:

```ts
        body: JSON.stringify({ targetMuscle, excludedIds, profile, history: buildSummary() }),
```

```ts
  }, [activeRoutine, profile, persistRoutine, buildSummary]);
```

2d. `handleCompleteWorkout` — guardar el workout antes de limpiar. Tras el cálculo del summary y antes de `persistRoutine(null)`:

```ts
    appendWorkout(activeRoutine);
    setWorkoutSummary(summary);
    persistRoutine(null);
```

y dependencias:

```ts
  }, [activeRoutine, persistRoutine, appendWorkout]);
```

2e. Exponer historial (lo usará el subsistema B; ya lo devuelve el hook interno) — añadir `history` al objeto de retorno de `useWorkout`.

- [ ] **Step 3: Verificar build**

```bash
cd frontend && npm test && npm run build
```

Expected: PASS + build limpio.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useHistory.ts frontend/src/hooks/useWorkout.ts
git commit -m "feat(frontend): persist workout history and send summary to API

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Badge de progresión en `ExerciseCard`

**Files:**
- Modify: `frontend/src/components/ExerciseCard.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Añadir badge en `ExerciseCard.tsx`**

En el bloque `exercise-card__badges`, tras el badge de dificultad:

```tsx
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
```

- [ ] **Step 2: Estilos en `frontend/src/App.css`**

Añadir al final:

```css
.progression-badge--up {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.progression-badge--keep {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.progression-badge--down {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
```

- [ ] **Step 3: Verificar build**

```bash
cd frontend && npm run build
```

Expected: limpio.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ExerciseCard.tsx frontend/src/App.css
git commit -m "feat(frontend): show progression direction badge per exercise

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Verificación E2E con Playwright

**Files:**
- Create: `/tmp/pwtest/verify-progression.js` (fuera del repo, verificación manual)

Requiere `playwright` npm instalado en `/tmp/pwtest` y Chromium de Playwright (ya presentes de la sesión de hotfixes; si no: `cd /tmp/pwtest && npm i playwright && npx playwright install chromium`).

- [ ] **Step 1: Crear script de verificación**

Crear `/tmp/pwtest/verify-progression.js`:

```js
const { chromium } = require('playwright');

// Historial sembrado: series al tope (12 reps, RPE 7, 40kg) para los ejercicios de una rutina
// generada previamente → al regenerar, el sesgo 70/30 los repite y deben salir con ↑ y peso 42.5/45.
// Los de autocarga salen '= Consolida'.

(async () => {
  const FAIL = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Los ids reales se leen de la API (misma experiencia que el formulario: intermediate)
  const res = await page.request.post('http://localhost:5000/api/routines/generate', {
    data: { weightKg: 80, heightCm: 180, age: 30, sex: 'masculino', experience: 'intermediate', split: 'Tren Superior', goal: 'Volumen' },
  });
  const catalogIds = (await res.json()).exercises.map(e => e.exercise.id);

  const seed = catalogIds.map(id => ({
    exerciseId: id,
    exerciseName: 'seed', targetMuscle: 'seed',
    sets: [
      { weightKg: 40, reps: 12, rpe: 7 },
      { weightKg: 40, reps: 12, rpe: 7 },
    ],
  }));
  const workoutLog = [{
    id: 'seed-1', date: new Date().toISOString(), split: 'Tren Superior', goal: 'Volumen',
    totalVolumeKg: 960, exercises: seed,
  }];

  await page.addInitScript(log => {
    localStorage.setItem('fit_poke_history_v1', JSON.stringify(log));
  }, workoutLog);

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.fill('#weight', '80');
  await page.click('button[type=submit]');
  await page.waitForSelector('.set-row', { timeout: 15000 });

  // Los ejercicios sembrados que salgan en la rutina deben llevar badge de progresión
  const badges = await page.locator('.progression-badge').allInnerTexts();
  console.log('Badges:', badges);
  if (badges.length === 0) FAIL.push('ningún badge de progresión con historial sembrado');
  if (!badges.some(b => b.includes('↑'))) FAIL.push('ningún ↑ Progresa (esperado con series al tope y RPE 7)');

  // Peso progresado visible: 40 + 2.5 → "42.5kg" o 40 + 5 → "45kg" en el objetivo
  const targets = await page.locator('.set-row__target').allInnerTexts();
  console.log('Targets:', targets.slice(0, 6));
  if (!targets.some(t => t.includes('42.5kg') || t.includes('45kg'))) {
    FAIL.push('ningún objetivo con peso progresado (42.5/45)');
  }

  // Completar la primera serie y terminar → el historial debe crecer
  await page.locator('.set-row').first().locator('.set-complete-btn').click();
  const skip = page.locator('button[title=Saltar]');
  if (await skip.count()) await skip.click();
  await page.click('text=Terminar Rutina ✨');
  await page.waitForSelector('.summary-card', { timeout: 5000 });

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fit_poke_history_v1') || '[]'));
  console.log('Workouts en historial tras completar:', stored.length);
  if (stored.length !== 2) FAIL.push(`historial esperaba 2 workouts, hay ${stored.length}`);

  await page.screenshot({ path: '/tmp/burnout_progression.png', fullPage: true });
  await browser.close();

  if (FAIL.length) {
    console.log('FAILURES:');
    FAIL.forEach(f => console.log(' -', f));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
})();
```

- [ ] **Step 2: Ejecutar con servidores levantados**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut" && python3 "/home/trib/.claude/plugins/marketplaces/anthropic-agent-skills/skills/webapp-testing/scripts/with_server.py" \
  --server "cd backend && npx ts-node src/server.ts" --port 5000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- node /tmp/pwtest/verify-progression.js
```

Expected: `ALL CHECKS PASSED`. Si falla, diagnosticar con `/tmp/burnout_progression.png` y no avanzar hasta que pase.

- [ ] **Step 3: Revisar screenshot**

Leer `/tmp/burnout_progression.png` y comprobar visualmente badges y pesos.

---

### Task 10: Deploy y verificación en producción

- [ ] **Step 1: Push**

```bash
cd "/home/trib/Documentos/proyectos personales/BurnOut" && git push
```

- [ ] **Step 2: Verificar backend en Render (redeploy tarda unos minutos)**

Poll hasta que la API responda con progresión (background, ~30s por intento):

```bash
curl -s -X POST https://burnout-p817.onrender.com/api/routines/generate -H 'Content-Type: application/json' \
  -d '{"weightKg":80,"heightCm":180,"age":30,"sex":"masculino","experience":"intermediate","split":"Tren Superior","goal":"Volumen","history":[{"exerciseId":"ex-101","lastSession":{"date":"2026-07-01T10:00:00.000Z","goal":"Volumen","sets":[{"weightKg":40,"reps":12,"rpe":7}]}}]}' \
  | grep -o 'progressionDirection[^,]*'
```

Expected (cuando el deploy termine y ex-101 salga en la rutina): `progressionDirection":"up"`. Repetir varias veces si ex-101 no aparece (sesgo 70%, no garantía).

- [ ] **Step 3: Verificar frontend en Vercel**

Comprobar con el MCP de Vercel (`list_deployments`, projectId `prj_WQR9XsDM2yoPI4i4zKJRfRuQyhnY`, teamId `team_oB2AvvtdoRFzH4P9VYcvtrl8`) que el último deployment de producción está `READY` y corresponde al commit del push.

- [ ] **Step 4: Actualizar memoria de proyecto**

Actualizar `project_burnout_state.md` en el directorio de memoria: Fase 2A completada, subsistemas B y C pendientes.

---

## Self-review del plan

- **Cobertura del spec:** contratos localStorage/API (Tasks 1, 3, 6), ProgressionService y reglas 1–5 (Task 2), rangos por objetivo (Task 2), sesgo 70/30 + reroll aleatorio (Task 4), parse tolerante (Task 5), useHistory/cap/resumen (Tasks 6–7), badge UI (Task 8), testing Vitest + e2e (Tasks 2–4, 6, 9). Periodización, pantallas de historial y biblioteca: fuera de alcance, sin tareas — correcto.
- **Desviación consciente del spec:** los unit tests de frontend cubren la lógica pura en `lib/history.ts` (sin jsdom); el wrapper `useHistory` se cubre por e2e. Más simple que montar jsdom para un hook trivial.
- **Tipos consistentes:** `prescribe(exercise, goal, lastSession, fallbackWeightKg)` y `Prescription` idénticos en Tasks 2 y 4; `buildWorkoutLog(routine, date)`, `appendToHistory(history, log, max)`, `summarizeHistory(history, maxExercises)` idénticos en Tasks 6 y 7; `history` opcional con default `[]` en servicio y controller.
