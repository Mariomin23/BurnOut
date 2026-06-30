# BurnOut — Diseño de Mejoras (Fase 1.5)
**Fecha:** 2026-06-30  
**Enfoque:** Incremental por capa (Backend → Estado/Lógica → UI)

---

## Contexto

El MVP de Fase 1 está operativo. Este documento cubre los gaps identificados antes de abrir la Fase 2 (progresión automática, MongoDB).

**Estado actual:** ~20 ejercicios en JSON, App.tsx monolítico (415 líneas), streak sin lógica de fechas, sin validación de inputs en API, sin filtrado por dificultad.

---

## Decisiones clave

| Pregunta | Decisión |
|---|---|
| BBDD ejercicios | Expandir JSON estático (→ Fase 3 MongoDB) |
| App.tsx | Refactor + features en paralelo |
| Streak | Días consecutivos reales (rompe si saltas un día) |
| Git | Repo existente en GitHub, sin crear nuevo |

---

## Fase A — Backend

### A1. Expansión de `exercises.json`
Objetivo: mínimo 5-6 ejercicios por grupo muscular para que el re-roll siempre tenga candidatos del mismo músculo sin caer al fallback de categoría.

| Grupo muscular | Actual | Objetivo |
|---|---|---|
| Pecho | 3 | 7 |
| Espalda | 3 | 7 |
| Hombros | 2 | 5 |
| Bíceps | 1 | 4 |
| Tríceps | 1 | 4 |
| Cuádriceps | 3 | 6 |
| Femorales | 2 | 5 |
| Glúteos | 1 | 4 |
| Gemelos | 1 | 3 |
| Core | 2 | 5 |

Cada ejercicio nuevo debe incluir todos los campos del contrato: `id`, `name`, `target_muscle`, `split_category`, `youtube_video_url` (formato `/embed/`), `difficulty`, `description`.

### A2. Validación con Zod

Nuevo fichero: `backend/src/schemas/userProfile.schema.ts`

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
```

El controller valida antes de llamar al service. Error 400 con `{ error: string, details: ZodError }` en vez de crash.

### A3. Filtrado por dificultad en generación

`routineService.generateRoutine()` filtra ejercicios por dificultad antes de seleccionar:
- `beginner` → solo `beginner`
- `intermediate` → `beginner` | `intermediate`  
- `advanced` → cualquier dificultad

Fallback: si el pool filtrado tiene menos de 3 candidatos para un grupo muscular, amplía al nivel siguiente. Nunca devuelve rutina vacía.

### A4. IDs con `crypto.randomUUID()`

Reemplazar `Math.random().toString(36).substring(2, 11)` por `crypto.randomUUID()` en `routineService`. Nativo en Node 14.17+, cero dependencias.

---

## Fase B — Estado y Lógica (Hooks)

### B1. Extracción de hooks desde `App.tsx`

**`src/hooks/useWorkout.ts`**  
Responsabilidad: ciclo de vida de la rutina activa.  
Expone: `activeRoutine`, `loading`, `rerollingId`, `handleGenerateRoutine`, `handleRerollExercise`, `handleUpdateSet`, `handleCompleteWorkout`, `handleAbandonWorkout`, `workoutSummary`.

**`src/hooks/useStreak.ts`**  
Responsabilidad: persistencia y lógica de streak por días consecutivos.  
Expone: `streak`, `recordWorkout`.

**`src/hooks/useRestTimer.ts`**  
Responsabilidad: estado del timer de descanso.  
Expone: `restDuration`, `timerKey`, `handleStartRest`, `handleCloseTimer`.

`App.tsx` queda a ~80 líneas: imports, composición de 3 hooks, JSX de routing entre vistas.

### B2. Streak — estructura en LocalStorage

```ts
interface StreakData {
  count: number;
  lastWorkoutDate: string; // formato "YYYY-MM-DD"
}
```

Lógica al completar workout:
- `lastWorkoutDate === hoy` → no cambia (ya entrenaste hoy)
- `lastWorkoutDate === ayer` → `count++`
- `lastWorkoutDate` > 1 día atrás (o null) → reset a 1

Comparar solo fecha (sin hora) para evitar edge case de medianoche.  
Key en localStorage: `fit_poke_streak_v2` (nueva key para evitar conflicto con el número crudo anterior).

---

## Fase C — UI

### C1. Inline styles → clases CSS

Los componentes `ExerciseCard`, `App` (vistas de rutina activa, resumen de workout) tienen decenas de objetos de estilo inline. Mover a clases semánticas en `index.css`. Beneficios: menos presión GC por objetos fugaces, tematización más fácil, legibilidad.

Clases nuevas a añadir (ejemplos):
- `.workout-stats-bar`, `.workout-progress-fill`
- `.warmup-section`, `.cooldown-section`
- `.summary-grid`, `.summary-stat`
- `.set-row`, `.set-row--completed`

### C2. `ConfirmModal` — reemplaza `window.confirm`

Nuevo componente `src/components/ConfirmModal.tsx`.  
Props: `message`, `onConfirm`, `onCancel`.  
Diseño: overlay oscuro semitransparente + tarjeta glass centrada + botones "Cancelar" y "Abandonar" (danger).  
`window.confirm` bloquea el hilo UI en mobile y no respeta el tema de la app.

### C3. Skeleton loaders

Nuevo componente `src/components/ExerciseCardSkeleton.tsx`.  
Shimmer animado con `@keyframes shimmer` — mismo layout que `ExerciseCard` (header + 3 filas de sets). Se muestra durante el fetch de `/generate` en lugar del spinner de pulso actual.

### C4. Mejoras de accesibilidad en iframes YouTube

Añadir `referrerpolicy="strict-origin-when-cross-origin"` a los iframes.  
`title` ya está presente en el componente — verificar que sea descriptivo (usar `exercise.name`).

---

## Contrato de datos actualizado

### StreakData (LocalStorage)
```ts
interface StreakData {
  count: number;
  lastWorkoutDate: string; // "YYYY-MM-DD"
}
```

### UserProfile (sin cambios)
```ts
interface UserProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'masculino' | 'femenino' | 'otro';
  experience: 'beginner' | 'intermediate' | 'advanced';
  split: 'Tren Superior' | 'Tren Inferior' | 'Full Body';
  goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';
}
```

---

## Qué NO entra en esta fase

- MongoDB / Mongoose (Fase 3)
- Historial de entrenamientos persistente (Fase 3)
- SEO / JSON-LD (Fase 4)
- Sistema de medallas (Fase 4)
- PWA / service worker (candidato Fase 3)

---

## Orden de implementación

1. `exercises.json` — expansión (desbloquea re-roll funcional)
2. `userProfile.schema.ts` + validación en controller
3. Filtrado por dificultad en `routineService`
4. `crypto.randomUUID()` en `routineService`
5. Extraer `useWorkout`, `useStreak`, `useRestTimer`
6. Streak real (`fit_poke_streak_v2`)
7. `ConfirmModal` component
8. `ExerciseCardSkeleton` component
9. Inline styles → CSS classes
10. `contextburn.md` actualizado
