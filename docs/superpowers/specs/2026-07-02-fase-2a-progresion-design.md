# Fase 2A — Progresión Automática + Historial de Entrenamientos

**Fecha:** 2026-07-02
**Estado:** Aprobado
**Alcance:** Subsistema A de Fase 2. Los subsistemas B (visualización de progreso) y C (biblioteca ampliada + filtro de material) tendrán specs propios posteriores.

## Objetivo

El sistema guarda el historial de entrenamientos completados y usa el rendimiento real del usuario para sugerir pesos y repeticiones en la siguiente rutina, mediante doble progresión autorregulada por RPE. Sin historial, se mantiene la fórmula actual basada en peso corporal.

## Decisiones de arquitectura

| Decisión | Elección | Motivo |
|---|---|---|
| Almacenamiento del historial | localStorage (frontend) | No hay auth ni DB hasta Fase 3; Render tiene filesystem efímero |
| Cálculo de progresión | Backend (`ProgressionService`) | Lógica de negocio en servicios; en Fase 3 solo cambia la fuente del historial (Mongo) |
| Transporte | Resumen compacto en el request (última sesión por ejercicio, máx. 30 ejercicios) | Un roundtrip, backend stateless, payload acotado |
| Regla de progresión | Doble progresión + RPE | Autorregulada, estándar en hipertrofia, aprovecha el RPE ya registrado |
| Consistencia de ejercicios | Selección con sesgo 70/30 hacia ejercicios con historial | Sin repetir ejercicios la progresión nunca actuaría; se mantiene la novedad |
| Periodización por semanas | Fuera de alcance | Requiere calendario de entrenamiento inexistente; la doble progresión ya adapta semana a semana |

## 1. Datos y contratos

### localStorage — key `fit_poke_history_v1`

```ts
interface ExerciseSetLog { weightKg: number; reps: number; rpe: number }

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;     // conserva el nombre aunque cambie la BBDD
  targetMuscle: string;
  sets: ExerciseSetLog[];   // solo series con completed === true
}

interface WorkoutLog {
  id: string;               // id de la rutina completada
  date: string;             // ISO 8601
  split: 'Tren Superior' | 'Tren Inferior' | 'Full Body';
  goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';
  totalVolumeKg: number;
  exercises: ExerciseLog[];
}

// El historial es WorkoutLog[], append al terminar rutina.
// Cap: 100 workouts (FIFO). Workouts con 0 series completadas no se guardan.
```

### API — campo opcional `history` en `/generate` y `/reroll`

```ts
interface ExerciseHistorySummary {
  exerciseId: string;
  lastSession: {
    date: string;
    goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';
    sets: ExerciseSetLog[];
  };
}

// POST /api/routines/generate: { ...UserProfile, history?: ExerciseHistorySummary[] }
// POST /api/routines/reroll:   { targetMuscle, excludedIds, profile, history? }
```

En la respuesta, cada `WorkoutExercise` gana el campo opcional `progressionDirection?: 'up' | 'keep' | 'down'` (ausente cuando el peso viene de la fórmula de peso corporal).

Validación Zod con topes: `reps ≤ 100`, `weightKg ≤ 500`, `rpe 1–10`, máx. 30 entradas, máx. 10 sets por entrada. El `history` se valida con un `safeParse` separado del resto del body: si es inválido, el backend lo ignora (log warning) y genera con el fallback — nunca devuelve 400 por datos viejos del móvil.

### Rangos de reps por objetivo

`suggestedReps` pasa de valor fijo a derivarse de un rango:

| Objetivo | Rango | Sin historial se sugiere |
|---|---|---|
| Perder Peso | 12–15 | 12 |
| Volumen | 8–12 | 8 |
| Mantenerse Activo | 10–12 | 10 |

Nota: hasta ahora se sugería el valor alto/medio fijo (15/10/12); con rangos se empieza por el mínimo y se progresa hacia el tope.

## 2. Backend

### `ProgressionService` (`backend/src/services/progressionService.ts`)

Clase pura, sin I/O. Entrada: última sesión del ejercicio (`ExerciseHistorySummary | undefined`), rango de reps del objetivo, `weight_factor` y el fallback de peso corporal. Salida: `{ suggestedWeightKg, suggestedReps }` aplicado a todas las series del ejercicio.

Reglas, en orden de evaluación:

1. **Sin historial** → fallback: fórmula actual de peso corporal (`calculateSuggestedWeight`), reps = mínimo del rango.
2. **Autocarga** (`weight_factor === 0`) → peso 0 siempre; reps objetivo = mejor marca de la última sesión + 1, capado al tope del rango (no se almacena el objetivo de sesiones pasadas, solo lo ejecutado).
3. **Subir peso**: todas las series ≥ tope del rango Y RPE medio ≤ 8 → peso de referencia + incremento; reps = mínimo del rango.
4. **Bajar peso**: alguna serie < mínimo del rango O RPE medio ≥ 9.5 → peso de referencia − incremento (suelo: 2.5 kg); reps = mínimo del rango.
5. **Mantener**: mismo peso de referencia; reps objetivo = mejor marca de la última sesión + 1, capado al tope del rango.

Definiciones:
- **Peso de referencia** = máximo `weightKg` de la última sesión.
- **Incremento** = 5 kg si `weight_factor ≥ 1.2` (prensa, peso muerto, hip thrust…); 2.5 kg en el resto.
- **Cambio de objetivo** desde la última sesión → conserva peso de referencia, reps = mínimo del rango nuevo (no aplica reglas 3–5).
- Redondeo final a múltiplos de 2.5 kg, mínimo 2.5 kg (como hoy).

### Sesgo hacia historial en `RoutineService`

Al cubrir cada hueco muscular de la rutina: si entre los candidatos (ya filtrados por dificultad y no repetidos) hay ejercicios presentes en el `history` recibido → con probabilidad 70% se elige aleatoriamente uno de ellos; con 30% se elige aleatorio entre todos. Sin historial, comportamiento actual.

**Re-roll queda 100% aleatorio** — pedir cambio expresa querer variar. El ejercicio resultante recibe igualmente su progresión si tiene historial.

## 3. Frontend

### Hook nuevo `useHistory` (`frontend/src/hooks/useHistory.ts`)

- Estado inicial: parse de `fit_poke_history_v1` con try/catch → historial vacío si corrupto.
- `appendWorkout(routine: WorkoutRoutine)`: construye `WorkoutLog` con solo series `completed`, hace append y aplica el cap de 100.
- `buildSummary(): ExerciseHistorySummary[]`: última sesión por `exerciseId`, ordenado por fecha descendente, máximo 30.

### Cambios en `useWorkout`

- `handleCompleteWorkout`: llama a `appendWorkout(activeRoutine)` antes de `persistRoutine(null)`.
- `handleGenerateRoutine` y `handleRerollExercise`: adjuntan `history: buildSummary()` al body.
- Generación offline (`buildOfflineRoutine`): sin cambios.

### UI

Indicador de procedencia del peso junto al objetivo de cada serie: ↑ (subida por progresión), = (consolidación), ↓ (descarga), sin icono (fórmula de peso corporal). Requiere que el backend devuelva `progressionDirection?: 'up' | 'keep' | 'down'` por ejercicio en la respuesta. Sin pantallas nuevas — el historial visible y los gráficos son el subsistema B.

## 4. Errores y casos límite

| Caso | Comportamiento |
|---|---|
| localStorage corrupto | try/catch → historial vacío, la app funciona |
| `history` inválido en el request | Backend lo ignora y usa fallback; nunca 400 |
| Dos workouts el mismo día | Ambos se guardan; el streak ya deduplica por fecha |
| Workout sin series completadas | No se guarda log |
| `exerciseId` del historial ya no existe en la BBDD | Sin efecto: el match es por id contra los ejercicios seleccionados |
| Modo offline | Rutina de autocarga sin progresión, como hoy |

## 5. Testing

- **Backend (Vitest — primer framework de tests del proyecto):** `ProgressionService` es puro → unit tests directos. Casos: sin historial (fallback), autocarga (+1 rep / repite), subida, bajada por reps, bajada por RPE, mantener con +1 rep, cambio de objetivo, incremento 5 kg vs 2.5 kg, suelo de 2.5 kg, redondeo. También: sesgo 70/30 (test estadístico laxo o inyección de RNG) y Zod del `history`.
- **Frontend (Vitest + jsdom):** `useHistory` — round-trip de localStorage, cap de 100, `buildSummary` con múltiples sesiones del mismo ejercicio, corrupción.
- **E2E (Playwright, manual):** completar rutina → generar nueva → verificar que ejercicios repetidos traen peso progresado e indicador ↑/=/↓.

## Fuera de alcance (Fase 2A)

- Pantallas de historial y gráficos de progreso (subsistema B).
- Biblioteca ampliada, filtro con/sin material, carrera/calistenia (subsistema C).
- Periodización explícita por semanas/mesociclos.
- Lastre para ejercicios de autocarga.
- Migración del historial a backend/Mongo (Fase 3; el diseño ya lo permite).
