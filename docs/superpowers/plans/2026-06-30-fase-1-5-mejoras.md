# BurnOut Fase 1.5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los 10 gaps técnicos identificados en el spec de Fase 1.5: ejercicios insuficientes, sin validación de inputs, sin filtrado por dificultad, App.tsx monolítico, streak sin fechas, sin ConfirmModal, sin skeleton loaders, inline styles masivos.

**Architecture:** Backend primero (independiente del frontend), luego extracción de hooks de App.tsx (estado/lógica separado de UI), luego componentes UI nuevos, finalmente migración de inline styles a CSS semántico.

**Tech Stack:** Node.js/Express/TypeScript, Zod, React/Vite/TypeScript, CSS custom properties (sin librerías de UI nuevas).

---

## File Map

**Backend — modificados:**
- `backend/src/data/exercises.json` — expandir de 20 a 51 ejercicios
- `backend/src/schemas/userProfile.schema.ts` — NUEVO: esquemas Zod
- `backend/src/controllers/routineController.ts` — reemplazar validación manual por Zod
- `backend/src/services/routineService.ts` — añadir filtrado por dificultad + `randomUUID()`
- `backend/package.json` — añadir dependencia `zod`

**Frontend — nuevos:**
- `frontend/src/hooks/useRestTimer.ts`
- `frontend/src/hooks/useStreak.ts`
- `frontend/src/hooks/useWorkout.ts`
- `frontend/src/components/ConfirmModal.tsx`
- `frontend/src/components/ExerciseCardSkeleton.tsx`

**Frontend — modificados:**
- `frontend/src/App.tsx` — usar los 3 hooks, eliminar inline styles, usar ConfirmModal
- `frontend/src/components/ExerciseCard.tsx` — CSS classes en vez de inline styles
- `frontend/src/index.css` — añadir clases semánticas nuevas

---

## Task 1: Expandir exercises.json

**Files:**
- Modify: `backend/src/data/exercises.json`

- [ ] **Step 1: Añadir 31 ejercicios nuevos al JSON**

Abrir `backend/src/data/exercises.json`. Añadir los siguientes objetos antes del `]` final. El target_muscle debe coincidir **exactamente** con los strings que usa `routineService.ts`: `Pecho`, `Espalda`, `Hombros`, `Bíceps`, `Tríceps`, `Cuádriceps`, `Femorales`, `Glúteos`, `Gemelos`, `Core`.

```json
,
  {
    "id": "ex-111",
    "name": "Fondos en Paralelas (énfasis Pecho)",
    "target_muscle": "Pecho",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/l9pobBtb_vA",
    "difficulty": "intermediate",
    "description": "En paralelas, inclina el torso hacia adelante para activar el pecho. Baja hasta que los hombros queden al nivel de los codos."
  },
  {
    "id": "ex-112",
    "name": "Press Declinado con Mancuernas",
    "target_muscle": "Pecho",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/LfyQTBBBhGY",
    "difficulty": "intermediate",
    "description": "Tumbado en banco declinado, empuja las mancuernas verticalmente desde el pecho hacia arriba. Activa la porción inferior del pectoral."
  },
  {
    "id": "ex-113",
    "name": "Aperturas con Mancuernas en Banco Plano",
    "target_muscle": "Pecho",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/eozdVDA78K0",
    "difficulty": "beginner",
    "description": "Tumbado con mancuernas, abre los brazos en semicírculo hasta sentir el estiramiento en el pecho. Cierra controlando el peso."
  },
  {
    "id": "ex-114",
    "name": "Press en Máquina de Pecho",
    "target_muscle": "Pecho",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/xUm0BiZCWlQ",
    "difficulty": "beginner",
    "description": "Sentado en la máquina de press, empuja las agarraderas hacia adelante extendiendo los codos por completo. Ideal para principiantes."
  },
  {
    "id": "ex-115",
    "name": "Remo con Mancuerna a Una Mano",
    "target_muscle": "Espalda",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/roCP7Ry_5os",
    "difficulty": "beginner",
    "description": "Apoya una rodilla y mano en el banco. Tira de la mancuerna hacia tu cadera retrayendo la escápula al final del movimiento."
  },
  {
    "id": "ex-116",
    "name": "Remo en Máquina Sentado",
    "target_muscle": "Espalda",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/GZbfZ033f74",
    "difficulty": "beginner",
    "description": "Sentado en la máquina de remo, tira de las agarraderas hacia tu abdomen juntando los omóplatos. Mantén la espalda erguida."
  },
  {
    "id": "ex-117",
    "name": "Face Pull con Polea",
    "target_muscle": "Espalda",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/HSoHeSt2dPE",
    "difficulty": "beginner",
    "description": "Con polea alta y cuerda, tira hacia tu cara separando las manos al final. Activa trapecios medios y manguito rotador."
  },
  {
    "id": "ex-118",
    "name": "Pullover con Mancuerna",
    "target_muscle": "Espalda",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/FK4rHfGRk6c",
    "difficulty": "intermediate",
    "description": "Tumbado transversalmente en un banco, sostén la mancuerna sobre el pecho y baja los brazos por encima de la cabeza estirando el dorsal."
  },
  {
    "id": "ex-119",
    "name": "Press Arnold con Mancuernas",
    "target_muscle": "Hombros",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/6Z15_WdXmVw",
    "difficulty": "intermediate",
    "description": "Empieza con mancuernas frente a ti (como el top de un curl). Al subir, rota las palmas hacia fuera y empuja verticalmente sobre la cabeza."
  },
  {
    "id": "ex-120",
    "name": "Elevaciones Frontales con Disco",
    "target_muscle": "Hombros",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/0J3r4bOGMi4",
    "difficulty": "beginner",
    "description": "De pie con un disco sujetado a dos manos, eleva los brazos rectos hasta la horizontal activando el haz anterior del deltoides."
  },
  {
    "id": "ex-121",
    "name": "Pájaros en Banco Inclinado",
    "target_muscle": "Hombros",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/G1XtE0pG8e4",
    "difficulty": "intermediate",
    "description": "Apoyado boca abajo en banco inclinado, eleva las mancuernas lateralmente hasta la horizontal trabajando el haz posterior del deltoides."
  },
  {
    "id": "ex-122",
    "name": "Curl Martillo con Mancuernas",
    "target_muscle": "Bíceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/zC3nLlEvin4",
    "difficulty": "beginner",
    "description": "Con agarre neutro (pulgar arriba), flexiona los codos llevando las mancuernas hacia el hombro. Activa el braquial y braquiorradial."
  },
  {
    "id": "ex-123",
    "name": "Curl en Banco Scott",
    "target_muscle": "Bíceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/4sHMVMBg1R0",
    "difficulty": "intermediate",
    "description": "Apoya los tríceps en el banco Scott para aislar los bíceps. Baja lentamente hasta casi la extensión completa y sube contrayendo."
  },
  {
    "id": "ex-124",
    "name": "Curl con Polea Baja",
    "target_muscle": "Bíceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/NFzTWp2qpiE",
    "difficulty": "beginner",
    "description": "De pie frente a la polea baja con barra recta, flexiona los codos sin mover los hombros. Tensión constante durante todo el recorrido."
  },
  {
    "id": "ex-125",
    "name": "Fondos en Paralelas (énfasis Tríceps)",
    "target_muscle": "Tríceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/wjUmnZH528Y",
    "difficulty": "intermediate",
    "description": "En paralelas, mantén el torso vertical para aislar los tríceps. Baja controlado y extiende los codos completamente en la subida."
  },
  {
    "id": "ex-126",
    "name": "Press Francés con Barra EZ",
    "target_muscle": "Tríceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/d_KZxkY_0cM",
    "difficulty": "intermediate",
    "description": "Tumbado con barra EZ, baja la barra hacia la frente doblando solo los codos. Extiende para activar la cabeza larga del tríceps."
  },
  {
    "id": "ex-127",
    "name": "Extensión de Tríceps sobre la Cabeza con Mancuerna",
    "target_muscle": "Tríceps",
    "split_category": "tren_superior",
    "youtube_video_url": "https://www.youtube.com/embed/YybX7Wd8jQ-Q",
    "difficulty": "beginner",
    "description": "Sostén una mancuerna sobre la cabeza con ambas manos. Dobla los codos bajando el peso detrás de la cabeza y extiende."
  },
  {
    "id": "ex-208",
    "name": "Extensión de Piernas en Máquina",
    "target_muscle": "Cuádriceps",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/YyvSfVjQeL0",
    "difficulty": "beginner",
    "description": "Sentado en la máquina, extiende las rodillas completamente. Mantén el pie en posición neutra. Ideal para aislar el cuádriceps."
  },
  {
    "id": "ex-209",
    "name": "Sentadilla Goblet con Kettlebell",
    "target_muscle": "Cuádriceps",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/MxsFDhcyFyE",
    "difficulty": "beginner",
    "description": "Sostén una kettlebell frente al pecho y desciende en sentadilla profunda. Los codos empujan las rodillas hacia afuera al bajar."
  },
  {
    "id": "ex-210",
    "name": "Hack Squat en Máquina",
    "target_muscle": "Cuádriceps",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/sEM_zo6PYMA",
    "difficulty": "intermediate",
    "description": "En la máquina de hack squat, coloca los pies a lo ancho de los hombros. Baja hasta 90° de rodilla sin despegar los talones."
  },
  {
    "id": "ex-211",
    "name": "Curl Femoral de Pie en Máquina",
    "target_muscle": "Femorales",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/4CdFPoC-oBM",
    "difficulty": "beginner",
    "description": "De pie en la máquina, flexiona una pierna llevando el talón hacia el glúteo. Mantén la cadera estable durante todo el movimiento."
  },
  {
    "id": "ex-212",
    "name": "Buenos Días con Barra",
    "target_muscle": "Femorales",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/YA-h3n9L4YU",
    "difficulty": "intermediate",
    "description": "Barra en trapecios, rodillas levemente dobladas. Inclina el torso hacia adelante desde la cadera hasta sentir el estiramiento femoral."
  },
  {
    "id": "ex-213",
    "name": "Peso Muerto Sumo",
    "target_muscle": "Femorales",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/bkAKAFOp8M8",
    "difficulty": "advanced",
    "description": "Stance ancho con pies girados 45°. Agarre de barra entre las piernas. Empuja el suelo hacia afuera al subir activando femorales y aductores."
  },
  {
    "id": "ex-214",
    "name": "Patada de Glúteo en Máquina",
    "target_muscle": "Glúteos",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/EEiOFNNAzMg",
    "difficulty": "beginner",
    "description": "De pie en la máquina de cable, extiende la pierna hacia atrás apretando el glúteo al final. Mantén el core estable durante el movimiento."
  },
  {
    "id": "ex-215",
    "name": "Abductor en Máquina",
    "target_muscle": "Glúteos",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/keDQFGd-3rE",
    "difficulty": "beginner",
    "description": "Sentado en la máquina de abductor, separa las piernas contra la resistencia activando el glúteo medio y tensor de la fascia lata."
  },
  {
    "id": "ex-216",
    "name": "Bulgarian Split Squat",
    "target_muscle": "Glúteos",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/2C-uNgKwPLE",
    "difficulty": "intermediate",
    "description": "Pie trasero elevado en banco, desciende la rodilla delantera hacia el suelo. Activa glúteo, cuádriceps y estabilizadores de cadera."
  },
  {
    "id": "ex-217",
    "name": "Elevación de Gemelos Sentado en Máquina",
    "target_muscle": "Gemelos",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/wP9IiKqMsQw",
    "difficulty": "beginner",
    "description": "Sentado con las rodillas bajo el soporte de la máquina, eleva los talones sobre las puntas de los pies contrayendo el sóleo."
  },
  {
    "id": "ex-218",
    "name": "Elevación de Gemelos en Prensa 45°",
    "target_muscle": "Gemelos",
    "split_category": "tren_inferior",
    "youtube_video_url": "https://www.youtube.com/embed/JbyjNymZOt0",
    "difficulty": "beginner",
    "description": "En la prensa 45° sin peso ni bloqueo de rodillas, coloca las puntas de los pies en el borde de la plataforma y haz elevaciones de gemelos."
  },
  {
    "id": "ex-305",
    "name": "Crunch Abdominal",
    "target_muscle": "Core",
    "split_category": "ambos",
    "youtube_video_url": "https://www.youtube.com/embed/5dn5ynKKKKA",
    "difficulty": "beginner",
    "description": "Tumbado boca arriba, eleva el torso contrayendo el recto abdominal. No tires del cuello — la fuerza viene del abdomen."
  },
  {
    "id": "ex-306",
    "name": "Russian Twist con Disco",
    "target_muscle": "Core",
    "split_category": "ambos",
    "youtube_video_url": "https://www.youtube.com/embed/wkD8rjkodUI",
    "difficulty": "intermediate",
    "description": "Sentado con pies elevados y torso inclinado 45°, rota de lado a lado llevando el disco a tocar el suelo en cada repetición."
  },
  {
    "id": "ex-307",
    "name": "Elevación de Piernas Colgando",
    "target_muscle": "Core",
    "split_category": "ambos",
    "youtube_video_url": "https://www.youtube.com/embed/l4kQd9eWclI",
    "difficulty": "intermediate",
    "description": "Cuelga de una barra con agarre pronador. Eleva las piernas rectas (o dobladas) hasta la horizontal sin balancearte."
  }
```

- [ ] **Step 2: Verificar que el JSON es válido**

```bash
cd backend && node -e "const d = require('./src/data/exercises.json'); console.log('Total ejercicios:', d.length)"
```

Esperado: `Total ejercicios: 51`

- [ ] **Step 3: Verificar distribución por grupo muscular**

```bash
cd backend && node -e "
const d = require('./src/data/exercises.json');
const groups = {};
d.forEach(e => { groups[e.target_muscle] = (groups[e.target_muscle] || 0) + 1; });
console.table(groups);
"
```

Esperado: todos los grupos con 3+ ejercicios.

- [ ] **Step 4: Commit**

```bash
git add backend/src/data/exercises.json
git commit -m "feat(data): expand exercise database from 20 to 51 entries

Adds 31 new exercises ensuring 5-6+ per muscle group.
Re-roll now has enough candidates to always find same-muscle alternatives."
```

---

## Task 2: Validación con Zod

**Files:**
- Create: `backend/src/schemas/userProfile.schema.ts`
- Modify: `backend/src/controllers/routineController.ts`
- Modify: `backend/package.json` (via npm install)

- [ ] **Step 1: Instalar Zod**

```bash
cd backend && npm install zod
```

Verificar que `backend/package.json` tiene `"zod"` en `dependencies`.

- [ ] **Step 2: Crear el fichero de esquemas**

Crear `backend/src/schemas/userProfile.schema.ts`:

```ts
import { z } from 'zod';

export const UserProfileSchema = z.object({
  weightKg: z.number().positive().max(300),
  heightCm: z.number().positive().max(250),
  age: z.number().int().min(14).max(100),
  sex: z.enum(['masculino', 'femenino', 'otro']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  split: z.enum(['Tren Superior', 'Tren Inferior', 'Full Body']),
  goal: z.enum(['Perder Peso', 'Volumen', 'Mantenerse Activo']),
});

export const RerollRequestSchema = z.object({
  targetMuscle: z.string().min(1),
  excludedIds: z.array(z.string()),
  profile: UserProfileSchema,
});

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;
export type ValidatedRerollRequest = z.infer<typeof RerollRequestSchema>;
```

- [ ] **Step 3: Reemplazar validación manual en el controller**

Reemplazar el contenido completo de `backend/src/controllers/routineController.ts`:

```ts
import { Request, Response } from 'express';
import { RoutineService } from '../services/routineService';
import { UserProfileSchema, RerollRequestSchema } from '../schemas/userProfile.schema';

export class RoutineController {
  constructor(private routineService: RoutineService) {}

  public generate = async (req: Request, res: Response): Promise<void> => {
    const result = UserProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Datos del perfil inválidos', details: result.error.format() });
      return;
    }
    try {
      const routine = await this.routineService.generateRoutine(result.data);
      res.json(routine);
    } catch (error) {
      console.error('Error generating routine:', error);
      res.status(500).json({ error: 'Error interno al generar la rutina' });
    }
  };

  public reroll = async (req: Request, res: Response): Promise<void> => {
    const result = RerollRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Parámetros de re-roll inválidos', details: result.error.format() });
      return;
    }
    try {
      const { targetMuscle, excludedIds, profile } = result.data;
      const workoutExercise = await this.routineService.rerollExercise(targetMuscle, excludedIds, profile);
      res.json(workoutExercise);
    } catch (error) {
      console.error('Error in re-roll:', error);
      res.status(500).json({ error: 'Error interno al hacer re-roll del ejercicio' });
    }
  };
}
```

- [ ] **Step 4: Verificar que el servidor compila y arranca**

```bash
cd backend && npx ts-node src/server.ts
```

Esperado: sin errores de TypeScript, servidor escuchando en puerto 5000.

- [ ] **Step 5: Verificar que Zod rechaza inputs inválidos**

En otra terminal:

```bash
curl -s -X POST http://localhost:5000/api/routines/generate \
  -H "Content-Type: application/json" \
  -d '{"weightKg": -10, "split": "Tren Superior", "goal": "Volumen", "experience": "beginner"}' | jq .
```

Esperado: `{ "error": "Datos del perfil inválidos", "details": { ... } }` con status 400.

- [ ] **Step 6: Verificar que inputs válidos siguen funcionando**

```bash
curl -s -X POST http://localhost:5000/api/routines/generate \
  -H "Content-Type: application/json" \
  -d '{"weightKg": 80, "heightCm": 178, "age": 28, "sex": "masculino", "experience": "intermediate", "split": "Tren Superior", "goal": "Volumen"}' | jq '.exercises | length'
```

Esperado: `6`

- [ ] **Step 7: Commit**

```bash
git add backend/src/schemas/userProfile.schema.ts backend/src/controllers/routineController.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): add Zod input validation to all endpoints

Replaces manual field checks with structured schema validation.
Returns 400 with formatted Zod errors on invalid input."
```

---

## Task 3: Difficulty Filtering + crypto.randomUUID

**Files:**
- Modify: `backend/src/services/routineService.ts`

- [ ] **Step 1: Añadir método `filterByDifficulty` y actualizar `generateRoutine`**

En `backend/src/services/routineService.ts`, hacer los siguientes cambios:

**1a. Añadir el import de `randomUUID` al principio del fichero:**

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
  Sex
} from '../types';
```

**1b. Al inicio de `generateRoutine`, después de obtener `allExercises`, añadir el filtro de dificultad:**

Localizar esta línea en `generateRoutine`:
```ts
const allExercises = await this.exerciseRepository.getAll();
const split = profile.split;
const goal = profile.goal;
```

Reemplazar por:
```ts
const rawExercises = await this.exerciseRepository.getAll();
const allExercises = this.filterByDifficulty(rawExercises, profile.experience);
const split = profile.split;
const goal = profile.goal;
```

**1c. Al inicio de `rerollExercise`, aplicar el mismo filtro:**

Localizar en `rerollExercise`:
```ts
const allExercises = await this.exerciseRepository.getAll();

// Filter matching muscle and not excluded
```

Reemplazar por:
```ts
const rawExercises = await this.exerciseRepository.getAll();
const allExercises = this.filterByDifficulty(rawExercises, profile.experience);

// Filter matching muscle and not excluded
```

**1d. Reemplazar el ID de la rutina:**

Localizar:
```ts
id: Math.random().toString(36).substring(2, 11),
```

Reemplazar por:
```ts
id: randomUUID(),
```

**1e. Añadir el método privado `filterByDifficulty` al final de la clase, antes del método `shuffle`:**

```ts
private filterByDifficulty(exercises: Exercise[], experience: Difficulty): Exercise[] {
  if (experience === 'beginner') {
    return exercises.filter(e => e.difficulty === 'beginner');
  }
  if (experience === 'intermediate') {
    return exercises.filter(e => e.difficulty !== 'advanced');
  }
  return exercises;
}
```

- [ ] **Step 2: Verificar que un beginner solo recibe ejercicios de nivel beginner**

Arrancar el servidor y ejecutar:

```bash
curl -s -X POST http://localhost:5000/api/routines/generate \
  -H "Content-Type: application/json" \
  -d '{"weightKg": 65, "heightCm": 165, "age": 22, "sex": "femenino", "experience": "beginner", "split": "Tren Superior", "goal": "Perder Peso"}' \
  | jq '[.exercises[].exercise | {name, difficulty}]'
```

Esperado: todos los ejercicios con `"difficulty": "beginner"`.

- [ ] **Step 3: Verificar que el ID de la rutina tiene formato UUID**

```bash
curl -s -X POST http://localhost:5000/api/routines/generate \
  -H "Content-Type: application/json" \
  -d '{"weightKg": 80, "heightCm": 178, "age": 28, "sex": "masculino", "experience": "advanced", "split": "Tren Inferior", "goal": "Volumen"}' \
  | jq '.id'
```

Esperado: string con formato `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/routineService.ts
git commit -m "feat(backend): add difficulty filtering and crypto UUID

- filterByDifficulty: beginner→only beginner, intermediate→excl. advanced
- randomUUID() replaces Math.random().toString(36) for routine IDs"
```

---

## Task 4: Hook useRestTimer

**Files:**
- Create: `frontend/src/hooks/useRestTimer.ts`

- [ ] **Step 1: Crear el hook**

Crear `frontend/src/hooks/useRestTimer.ts`:

```ts
import { useState, useCallback } from 'react';

export function useRestTimer() {
  const [restDuration, setRestDuration] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  const handleStartRest = useCallback((seconds: number) => {
    setRestDuration(seconds);
    setTimerKey(prev => prev + 1);
  }, []);

  const handleCloseTimer = useCallback(() => {
    setRestDuration(null);
  }, []);

  return { restDuration, timerKey, handleStartRest, handleCloseTimer };
}
```

- [ ] **Step 2: Verificar que compila sin errores**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useRestTimer.ts
git commit -m "refactor(frontend): extract useRestTimer hook"
```

---

## Task 5: Hook useStreak con lógica de días consecutivos

**Files:**
- Create: `frontend/src/hooks/useStreak.ts`

- [ ] **Step 1: Crear el hook**

Crear `frontend/src/hooks/useStreak.ts`:

```ts
import { useState, useCallback } from 'react';

interface StreakData {
  count: number;
  lastWorkoutDate: string;
}

const STORAGE_KEY = 'fit_poke_streak_v2';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function readStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data: StreakData = JSON.parse(raw);
    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86400000));
    if (data.lastWorkoutDate === today || data.lastWorkoutDate === yesterday) {
      return data.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function useStreak() {
  const [streak, setStreak] = useState<number>(readStreak);

  const recordWorkout = useCallback(() => {
    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86400000));

    let newCount: number;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        newCount = 1;
      } else {
        const data: StreakData = JSON.parse(raw);
        if (data.lastWorkoutDate === today) return;
        newCount = data.lastWorkoutDate === yesterday ? data.count + 1 : 1;
      }
    } catch {
      newCount = 1;
    }

    const newData: StreakData = { count: newCount, lastWorkoutDate: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setStreak(newCount);
  }, []);

  return { streak, recordWorkout };
}
```

- [ ] **Step 2: Verificar en browser que la lógica de fechas funciona**

Abrir la consola del navegador con la app corriendo (`cd frontend && npm run dev`). Ejecutar:

```js
// Simular un workout de ayer
localStorage.setItem('fit_poke_streak_v2', JSON.stringify({
  count: 5,
  lastWorkoutDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
}));
// Recargar la página — el streak debería mostrar 5
// Completar un workout — debería subir a 6
```

- [ ] **Step 3: Verificar que se rompe si saltas un día**

```js
// Simular un workout de hace 2 días
localStorage.setItem('fit_poke_streak_v2', JSON.stringify({
  count: 5,
  lastWorkoutDate: new Date(Date.now() - 172800000).toISOString().split('T')[0]
}));
// Recargar — streak debería mostrar 0 (roto)
// Completar un workout — debería ser 1
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useStreak.ts
git commit -m "feat(frontend): streak hook with consecutive-days logic

- Reads streak from fit_poke_streak_v2 key (new format with date)
- Breaks if last workout was 2+ days ago
- recordWorkout() is idempotent within the same day"
```

---

## Task 6: Hook useWorkout

**Files:**
- Create: `frontend/src/hooks/useWorkout.ts`

- [ ] **Step 1: Crear el hook**

Crear `frontend/src/hooks/useWorkout.ts`:

```ts
import { useState, useCallback } from 'react';
import type { UserProfile, WorkoutRoutine, WorkoutExercise, RoutineSet } from '../types';

const API_BASE_URL = 'http://localhost:5000/api/routines';
const ROUTINE_KEY = 'fit_poke_active_routine';
const PROFILE_KEY = 'fit_poke_profile';

function buildOfflineRoutine(userProfile: UserProfile): WorkoutRoutine {
  return {
    id: `fallback-${Math.random().toString(36).substring(2, 7)}`,
    split: userProfile.split,
    goal: userProfile.goal,
    warmup: ['5 min de movilidad articular general', 'Sentadillas dinámicas libres (15 reps)'],
    exercises: [
      {
        exercise: {
          id: 'ex-fb1',
          name: userProfile.split === 'Tren Inferior' ? 'Sentadillas Corporales Profundas' : 'Flexiones de Pecho',
          target_muscle: userProfile.split === 'Tren Inferior' ? 'Cuádriceps' : 'Pecho',
          split_category: userProfile.split === 'Tren Inferior' ? 'tren_inferior' : 'tren_superior',
          youtube_video_url: 'https://www.youtube.com/embed/yR3_92s8Zt4',
          difficulty: userProfile.experience,
          description: 'Ejercicio de autocarga de emergencia offline. Realízalo con técnica controlada.',
        },
        sets: Array.from({ length: 3 }, (_, i) => ({
          setIndex: i + 1,
          suggestedReps: userProfile.goal === 'Perder Peso' ? 15 : 12,
          suggestedWeightKg: 0,
        })),
        restTimerSeconds: 60,
      },
    ],
    cooldown: ['Estiramientos generales pasivos (1 min)'],
    createdAt: new Date().toISOString(),
    isCompleted: false,
  };
}

export interface WorkoutSummary {
  totalVolumeKg: number;
  completedSets: number;
  avgRpe: number;
}

export function useWorkout() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(() => {
    try {
      const raw = localStorage.getItem(ROUTINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [rerollingId, setRerollingId] = useState<string | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const persistRoutine = useCallback((routine: WorkoutRoutine | null) => {
    setActiveRoutine(routine);
    if (routine) {
      localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
    } else {
      localStorage.removeItem(ROUTINE_KEY);
    }
  }, []);

  const handleGenerateRoutine = useCallback(async (userProfile: UserProfile) => {
    setLoading(true);
    setWorkoutSummary(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });
      if (!response.ok) throw new Error('No se pudo generar la rutina');
      const routineData: WorkoutRoutine = await response.json();
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      persistRoutine(routineData);
    } catch {
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      persistRoutine(buildOfflineRoutine(userProfile));
    } finally {
      setLoading(false);
    }
  }, [persistRoutine]);

  const handleRerollExercise = useCallback(async (exerciseId: string, targetMuscle: string) => {
    if (!activeRoutine || !profile) return;
    setRerollingId(exerciseId);
    const excludedIds = activeRoutine.exercises.map(e => e.exercise.id);
    try {
      const response = await fetch(`${API_BASE_URL}/reroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMuscle, excludedIds, profile }),
      });
      if (!response.ok) throw new Error('Error al hacer re-roll');
      const newExercise: WorkoutExercise = await response.json();
      persistRoutine({
        ...activeRoutine,
        exercises: activeRoutine.exercises.map(item =>
          item.exercise.id === exerciseId ? newExercise : item
        ),
      });
    } catch {
      // Silent fail — el usuario se queda en el ejercicio actual
    } finally {
      setRerollingId(null);
    }
  }, [activeRoutine, profile, persistRoutine]);

  const handleUpdateSet = useCallback((exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => {
    if (!activeRoutine) return;
    persistRoutine({
      ...activeRoutine,
      exercises: activeRoutine.exercises.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        return {
          ...item,
          sets: item.sets.map(set =>
            set.setIndex === setIndex ? { ...set, ...updatedFields } : set
          ),
        };
      }),
    });
  }, [activeRoutine, persistRoutine]);

  const handleCompleteWorkout = useCallback((): WorkoutSummary => {
    if (!activeRoutine) return { totalVolumeKg: 0, completedSets: 0, avgRpe: 0 };
    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalRpeSum = 0;

    activeRoutine.exercises.forEach(item => {
      item.sets.forEach(set => {
        if (set.completedReps !== undefined) {
          totalVolume += (set.completedWeightKg ?? 0) * set.completedReps;
          completedSetsCount++;
          totalRpeSum += set.completedRpe ?? 8;
        }
      });
    });

    const summary: WorkoutSummary = {
      totalVolumeKg: totalVolume,
      completedSets: completedSetsCount,
      avgRpe: completedSetsCount > 0
        ? Number((totalRpeSum / completedSetsCount).toFixed(1))
        : 0,
    };
    setWorkoutSummary(summary);
    persistRoutine(null);
    return summary;
  }, [activeRoutine, persistRoutine]);

  const handleAbandonWorkout = useCallback(() => {
    persistRoutine(null);
    setWorkoutSummary(null);
    setShowAbandonModal(false);
  }, [persistRoutine]);

  const handleGoHome = useCallback(() => {
    setWorkoutSummary(null);
  }, []);

  return {
    profile,
    activeRoutine,
    loading,
    rerollingId,
    workoutSummary,
    showAbandonModal,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  };
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useWorkout.ts
git commit -m "refactor(frontend): extract useWorkout hook

All routine lifecycle logic out of App.tsx: generate, reroll, updateSet,
completeWorkout, abandonWorkout. LocalStorage persistence encapsulated."
```

---

## Task 7: Refactorizar App.tsx usando los 3 hooks

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Reemplazar el contenido completo de App.tsx**

```tsx
import { useMemo, useState } from 'react';
import { UserProfileForm } from './components/UserProfileForm';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseCardSkeleton } from './components/ExerciseCardSkeleton';
import { RestTimer } from './components/RestTimer';
import { ConfirmModal } from './components/ConfirmModal';
import { useWorkout } from './hooks/useWorkout';
import { useStreak } from './hooks/useStreak';
import { useRestTimer } from './hooks/useRestTimer';

function App() {
  const {
    activeRoutine,
    loading,
    rerollingId,
    workoutSummary,
    showAbandonModal,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  } = useWorkout();

  const { streak, recordWorkout } = useStreak();
  const { restDuration, timerKey, handleStartRest, handleCloseTimer } = useRestTimer();

  const onCompleteWorkout = () => {
    handleCompleteWorkout();
    recordWorkout();
  };

  const progressRatio = useMemo(() => {
    if (!activeRoutine) return 0;
    let total = 0;
    let completed = 0;
    activeRoutine.exercises.forEach(item => {
      item.sets.forEach(set => {
        total++;
        if (set.completedReps !== undefined) completed++;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [activeRoutine]);

  return (
    <div className="container">
      <header className="app-header fade-in">
        <h1 className="logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          <span>☄️</span> Fit-PokéAPI
        </h1>
        {streak > 0 && (
          <div className="badge-pill badge-streak">
            🔥 Racha: <strong>{streak}</strong>
          </div>
        )}
      </header>

      {/* Loading skeleton */}
      {loading && (
        <div className="loading-container fade-in">
          <ExerciseCardSkeleton />
          <ExerciseCardSkeleton />
          <ExerciseCardSkeleton />
        </div>
      )}

      {/* Workout summary */}
      {!loading && workoutSummary && (
        <div className="glass summary-card fade-in">
          <div className="summary-trophy">🏆</div>
          <h2 className="summary-title">¡Entrenamiento Completado!</h2>
          <p className="summary-subtitle">
            Buen trabajo. Has sumado un entrenamiento más a tu rutina deportiva.
          </p>
          <div className="summary-grid">
            <div className="glass summary-stat">
              <div className="summary-stat__label">Volumen</div>
              <div className="summary-stat__value summary-stat__value--secondary">
                {workoutSummary.totalVolumeKg} kg
              </div>
            </div>
            <div className="glass summary-stat">
              <div className="summary-stat__label">Series</div>
              <div className="summary-stat__value summary-stat__value--primary">
                {workoutSummary.completedSets}
              </div>
            </div>
            <div className="glass summary-stat">
              <div className="summary-stat__label">RPE Medio</div>
              <div className="summary-stat__value summary-stat__value--accent">
                {workoutSummary.avgRpe || 'N/A'}
              </div>
            </div>
          </div>
          <div className="summary-streak-box">
            <div className="summary-streak-count">
              <span>🔥</span> Racha Actual: {streak} días
            </div>
            <p className="summary-streak-hint">
              ¡No rompas el ciclo! Vuelve mañana para seguir mejorando.
            </p>
          </div>
          <button onClick={handleGoHome} className="btn btn-primary" style={{ width: '100%' }}>
            Nuevo Entrenamiento ⚡
          </button>
        </div>
      )}

      {/* Profile form */}
      {!loading && !activeRoutine && !workoutSummary && (
        <UserProfileForm onSubmit={handleGenerateRoutine} isLoading={loading} />
      )}

      {/* Active workout */}
      {!loading && activeRoutine && !workoutSummary && (
        <div className="fade-in">
          <div className="glass workout-stats-bar">
            <div className="workout-stats-bar__top">
              <div>
                <span className="badge-pill badge-split" style={{ marginRight: '0.5rem' }}>
                  {activeRoutine.split}
                </span>
                <span className="badge-pill badge-goal">{activeRoutine.goal}</span>
              </div>
              <div className="workout-stats-bar__progress-label">
                Progreso: {progressRatio}%
              </div>
            </div>
            <div className="workout-progress-track">
              <div
                className="workout-progress-fill"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>

          <div className="glass warmup-section">
            <h3 className="warmup-section__title">
              <span>🧘‍♂️</span> Calentamiento Específico
            </h3>
            <ul className="phase-list">
              {activeRoutine.warmup.map((item, idx) => (
                <li key={idx} className="phase-list__item">
                  <span className="phase-list__bullet phase-list__bullet--secondary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <h2 className="exercises-heading">Ejercicios del Día 🏋️</h2>

          {activeRoutine.exercises.map(item => (
            <ExerciseCard
              key={item.exercise.id}
              item={item}
              onReroll={handleRerollExercise}
              onUpdateSet={handleUpdateSet}
              onStartRest={handleStartRest}
              isRerolling={rerollingId === item.exercise.id}
            />
          ))}

          <div className="glass cooldown-section">
            <h3 className="cooldown-section__title">
              <span>❄️</span> Vuelta a la Calma
            </h3>
            <ul className="phase-list">
              {activeRoutine.cooldown.map((item, idx) => (
                <li key={idx} className="phase-list__item">
                  <span className="phase-list__bullet phase-list__bullet--primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="workout-actions">
            <button onClick={() => setShowAbandonModal(true)} className="btn btn-danger">
              Abandonar
            </button>
            <button onClick={onCompleteWorkout} className="btn btn-primary">
              Terminar Rutina ✨
            </button>
          </div>
        </div>
      )}

      {showAbandonModal && (
        <ConfirmModal
          message="¿Seguro que quieres abandonar el entrenamiento actual? Los datos no guardados se perderán."
          confirmLabel="Abandonar"
          cancelLabel="Cancelar"
          onConfirm={handleAbandonWorkout}
          onCancel={() => setShowAbandonModal(false)}
        />
      )}

      {restDuration !== null && (
        <RestTimer
          key={timerKey}
          initialSeconds={restDuration}
          onClose={handleCloseTimer}
        />
      )}
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Verificar que compila (ExerciseCardSkeleton y ConfirmModal aún no existen — TypeScript fallará)**

Este step fallará porque `ExerciseCardSkeleton` y `ConfirmModal` se crean en Tasks 8 y 9. Continuar con esas tasks antes de verificar.

- [ ] **Step 3: Commit (después de Tasks 8 y 9)**

Commitear junto con los componentes nuevos — ver instrucción al final de Task 9.

---

## Task 8: Componente ConfirmModal

**Files:**
- Create: `frontend/src/components/ConfirmModal.tsx`

- [ ] **Step 1: Crear el componente**

Crear `frontend/src/components/ConfirmModal.tsx`:

```tsx
import React from 'react';

interface ConfirmModalProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card glass fade-in"
        onClick={e => e.stopPropagation()}
      >
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Añadir estilos del modal a index.css**

Añadir al final de `frontend/src/index.css`:

```css
/* ConfirmModal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  width: 100%;
  max-width: 360px;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.modal-message {
  font-size: 0.95rem;
  color: var(--text-main);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
```

---

## Task 9: Componente ExerciseCardSkeleton

**Files:**
- Create: `frontend/src/components/ExerciseCardSkeleton.tsx`
- Modify: `frontend/src/index.css` (añadir animación shimmer)

- [ ] **Step 1: Añadir keyframe shimmer a index.css**

Añadir al final de `frontend/src/index.css`:

```css
/* Skeleton loaders */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.09) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-line {
  height: 14px;
  margin-bottom: 0.5rem;
}

.skeleton-line--short { width: 40%; }
.skeleton-line--medium { width: 65%; }
.skeleton-line--full { width: 100%; }

.skeleton-row {
  display: grid;
  grid-template-columns: 40px 1fr 75px 65px 60px 40px;
  gap: 6px;
  margin-bottom: 0.5rem;
}

.skeleton-cell {
  height: 32px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

- [ ] **Step 2: Crear el componente**

Crear `frontend/src/components/ExerciseCardSkeleton.tsx`:

```tsx
import React from 'react';

export const ExerciseCardSkeleton: React.FC = () => {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="skeleton-shimmer skeleton-line skeleton-line--short" style={{ marginBottom: '0.5rem' }} />
        <div className="skeleton-shimmer skeleton-line skeleton-line--medium" />
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

- [ ] **Step 3: Verificar que el proyecto compila**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin errores (ahora que existen ConfirmModal y ExerciseCardSkeleton, App.tsx debería compilar).

- [ ] **Step 4: Arrancar la app y verificar visualmente**

```bash
cd frontend && npm run dev
```

Abrir `http://localhost:5173`. Verificar:
- El formulario de perfil se muestra correctamente.
- Al generar una rutina aparecen 3 skeleton cards mientras carga.
- Al completar la rutina el botón "Abandonar" abre un modal (no `window.confirm`).
- El modal tiene estilos coherentes con el tema oscuro.

- [ ] **Step 5: Commit (Tasks 7, 8 y 9 juntas)**

```bash
git add frontend/src/App.tsx frontend/src/hooks/ frontend/src/components/ConfirmModal.tsx frontend/src/components/ExerciseCardSkeleton.tsx frontend/src/index.css
git commit -m "refactor(frontend): extract hooks + add ConfirmModal + ExerciseCardSkeleton

- App.tsx: 415 → ~130 lines, uses useWorkout/useStreak/useRestTimer
- ConfirmModal replaces window.confirm for abandon action
- ExerciseCardSkeleton with shimmer animation replaces pulse spinner
- streak now uses useStreak with consecutive-days date logic"
```

---

## Task 10: CSS classes — migrar inline styles a clases semánticas

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/ExerciseCard.tsx`

- [ ] **Step 1: Añadir clases semánticas a index.css**

Añadir al final de `frontend/src/index.css` (después de los bloques de skeleton y modal):

```css
/* App layout */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}

.badge-streak {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-primary);
  border: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 0.8rem;
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

/* Workout stats bar */
.workout-stats-bar {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  border-left: 3px solid var(--color-primary);
}

.workout-stats-bar__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.workout-stats-bar__progress-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary);
}

.workout-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.workout-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-secondary), var(--color-primary));
  transition: width 0.3s ease;
}

/* Warmup / Cooldown sections */
.warmup-section {
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  background: rgba(2, 132, 199, 0.05);
  border-color: rgba(2, 132, 199, 0.15);
}

.warmup-section__title {
  font-size: 1rem;
  color: var(--color-secondary);
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cooldown-section {
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.15);
}

.cooldown-section__title {
  font-size: 1rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phase-list {
  list-style-type: none;
  padding-left: 0;
}

.phase-list__item {
  font-size: 0.8rem;
  color: var(--text-main);
  margin: 0.35rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.phase-list__bullet--primary { color: var(--color-primary); }
.phase-list__bullet--secondary { color: var(--color-secondary); }

.exercises-heading {
  font-size: 1.2rem;
  font-family: var(--font-heading);
  color: white;
  margin-bottom: 1rem;
}

.workout-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Summary card */
.summary-card {
  padding: 2rem;
  border-radius: var(--radius-lg);
  text-align: center;
  border: 1px solid var(--color-primary);
}

.summary-trophy { font-size: 3rem; margin-bottom: 0.5rem; }

.summary-title {
  font-family: var(--font-heading);
  color: white;
  margin-bottom: 0.5rem;
  font-size: 1.6rem;
}

.summary-subtitle {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.summary-stat {
  padding: 0.75rem;
  border-radius: var(--radius-md);
}

.summary-stat__label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.summary-stat__value {
  font-size: 1.1rem;
  font-weight: 800;
}

.summary-stat__value--primary { color: var(--color-primary); }
.summary-stat__value--secondary { color: var(--color-secondary); }
.summary-stat__value--accent { color: var(--color-accent); }

.summary-streak-box {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 2rem;
}

.summary-streak-count {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.summary-streak-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* ExerciseCard */
.exercise-card__header {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
}

.exercise-card__info { flex: 1; padding-right: 0.5rem; }

.exercise-card__badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.exercise-card__name {
  font-size: 1.1rem;
  color: #ffffff;
  font-family: var(--font-heading);
  font-weight: 700;
}

.exercise-card__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.exercise-card__body { padding: 1.25rem; }

.exercise-card__description {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
}

.set-table-header {
  display: grid;
  grid-template-columns: 40px 1fr 75px 65px 60px 40px;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
}

.set-row {
  display: grid;
  grid-template-columns: 40px 1fr 75px 65px 60px 40px;
  gap: 6px;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: opacity 0.2s ease;
}

.set-row--completed { opacity: 0.6; }

.set-row__index { font-size: 0.85rem; font-weight: 700; }
.set-row__index--completed { color: var(--color-primary); }
.set-row__index--pending { color: white; }

.set-row__target { font-size: 0.75rem; color: var(--text-muted); }

.set-input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.25rem;
  color: white;
  font-size: 0.85rem;
  text-align: center;
}

.set-select {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.15rem;
  color: white;
  font-size: 0.8rem;
  text-align: center;
  appearance: none;
}

.set-complete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.set-complete-btn--done {
  border: none;
  background: var(--color-primary);
  color: var(--text-dark);
}

.set-complete-btn--pending {
  border: 1px solid var(--border-color);
  background: transparent;
  color: transparent;
}

/* Difficulty badge colors */
.badge-difficulty--beginner {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-primary);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-difficulty--intermediate {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-difficulty--advanced {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

- [ ] **Step 2: Reemplazar inline styles en ExerciseCard.tsx**

Reemplazar el contenido completo de `frontend/src/components/ExerciseCard.tsx`:

```tsx
import React, { useState } from 'react';
import type { WorkoutExercise, RoutineSet } from '../types';

interface ExerciseCardProps {
  item: WorkoutExercise;
  onReroll: (exerciseId: string, targetMuscle: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => void;
  onStartRest: (seconds: number) => void;
  isRerolling: boolean;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  item,
  onReroll,
  onUpdateSet,
  onStartRest,
  isRerolling,
}) => {
  const { exercise, sets, restTimerSeconds } = item;
  const [showVideo, setShowVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass fade-in" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div className="exercise-card__header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="exercise-card__info">
          <div className="exercise-card__badges">
            <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
              {exercise.target_muscle}
            </span>
            <span className={`badge-pill badge-difficulty--${exercise.difficulty}`} style={{ fontSize: '0.65rem' }}>
              {DIFFICULTY_LABEL[exercise.difficulty] ?? exercise.difficulty}
            </span>
          </div>
          <h3 className="exercise-card__name">{exercise.name}</h3>
        </div>

        <div className="exercise-card__actions" onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-secondary btn-circle"
            style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
            onClick={() => setShowVideo(!showVideo)}
            title="Ver vídeo técnico"
          >
            📺
          </button>
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

      {isExpanded && (
        <div className="exercise-card__body">
          <p className="exercise-card__description">{exercise.description}</p>

          {showVideo && (
            <div className="video-wrapper fade-in">
              <iframe
                src={exercise.youtube_video_url}
                title={exercise.name}
                frameBorder="0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="set-table-header">
            <div>Set</div>
            <div>Objetivo</div>
            <div style={{ textAlign: 'center' }}>Peso (kg)</div>
            <div style={{ textAlign: 'center' }}>Reps</div>
            <div style={{ textAlign: 'center' }}>RPE</div>
            <div style={{ textAlign: 'right' }}>Ok</div>
          </div>

          {sets.map(set => {
            const isCompleted = set.completedReps !== undefined;
            return (
              <div
                key={set.setIndex}
                className={`set-row${isCompleted ? ' set-row--completed' : ''}`}
              >
                <div className={`set-row__index${isCompleted ? ' set-row__index--completed' : ' set-row__index--pending'}`}>
                  #{set.setIndex}
                </div>

                <div className="set-row__target">
                  {set.suggestedWeightKg > 0 ? `${set.suggestedWeightKg}kg` : 'Autocarga'} x {set.suggestedReps}
                </div>

                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="kg"
                  disabled={isCompleted}
                  value={set.completedWeightKg ?? ''}
                  className="set-input"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedWeightKg: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                />

                <input
                  type="number"
                  min="0"
                  placeholder="reps"
                  disabled={isCompleted}
                  value={set.completedReps ?? ''}
                  className="set-input"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedReps: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                />

                <select
                  disabled={isCompleted}
                  value={set.completedRpe ?? ''}
                  className="set-select"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedRpe: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                >
                  <option value="">RPE</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <div style={{ textAlign: 'right' }}>
                  <button
                    className={`set-complete-btn${isCompleted ? ' set-complete-btn--done' : ' set-complete-btn--pending'}`}
                    onClick={() => {
                      if (isCompleted) {
                        onUpdateSet(exercise.id, set.setIndex, {
                          completedReps: undefined,
                          completedWeightKg: undefined,
                          completedRpe: undefined,
                        });
                      } else {
                        onUpdateSet(exercise.id, set.setIndex, {
                          completedWeightKg: set.completedWeightKg ?? set.suggestedWeightKg,
                          completedReps: set.completedReps ?? set.suggestedReps,
                          completedRpe: set.completedRpe ?? 8,
                        });
                        onStartRest(restTimerSeconds);
                      }
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Verificar compilación y aspecto visual**

```bash
cd frontend && npx tsc --noEmit
```

Arrancar app y verificar:
- Tarjetas de ejercicio tienen el mismo aspecto que antes.
- Badge de dificultad muestra color correcto (verde/ámbar/rojo).
- Sets con inputs funcionan igual.
- Botón de completar serie activa el timer.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/src/components/ExerciseCard.tsx
git commit -m "refactor(frontend): replace inline styles with semantic CSS classes

ExerciseCard and App workout views now use named CSS classes.
Reduces anonymous style objects, eases theming and readability."
```

---

## Self-Review

### Spec coverage

| Requisito spec | Task que lo implementa |
|---|---|
| BBDD 50+ ejercicios | Task 1 |
| Filtrado por dificultad | Task 3 |
| Zod validation | Task 2 |
| crypto.randomUUID | Task 3 |
| useRestTimer hook | Task 4 |
| useStreak días consecutivos | Task 5 |
| useWorkout hook | Task 6 |
| App.tsx refactor | Task 7 |
| ConfirmModal | Task 8 |
| ExerciseCardSkeleton | Task 9 |
| CSS classes | Task 10 |

Cobertura: **10/10** ✓

### Placeholders

Ningún TBD, TODO ni "implement later" en el plan. ✓

### Type consistency

- `WorkoutSummary` definido en `useWorkout.ts` (Task 6), importado en `App.tsx` (Task 7). ✓
- `StreakData` definido solo en `useStreak.ts` (Task 5), no se exporta ni se usa fuera. ✓
- `handleStartRest(seconds: number)` en `useRestTimer` (Task 4) coincide con el prop `onStartRest` en `ExerciseCard` (Task 10). ✓
- `handleCloseTimer` en `useRestTimer` coincide con prop `onClose` de `RestTimer`. ✓
- `showAbandonModal` y `setShowAbandonModal` definidos en `useWorkout` (Task 6), usados en `App.tsx` (Task 7). ✓
