# Fase 2B — Perfil Extendido y Gráficos de Progreso (Design)

**Fecha:** 2026-07-08
**Origen:** `contextburn.md` §5.B — "Historial de entrenamientos con fecha, volumen total y grupos musculares trabajados" + "Visualización de progreso por ejercicio (gráfico de peso vs. semanas)".

## Decisiones

1. **100% frontend.** El historial ya vive en localStorage (`fit_poke_history_v1`, `WorkoutLog[]`, cap 100) vía `useHistory`. El backend no interviene: sin auth (Fase 3), el historial es por-dispositivo.
2. **Sin librería de gráficos.** Line chart en SVG puro (~320x150 viewBox) con gradiente emerald→sky de Ember Ledger. Mantiene el bundle pequeño (principio de carga ultra-rápida) y el control total del estilo.
3. **Navegación por estado local en `App`** (`view: 'home' | 'history'`). Botón "Historial y Progreso" en la home (solo si hay historial); botón volver en la vista. Sin router: dos vistas no justifican la dependencia.
4. **Métrica del gráfico: peso máximo por sesión** (top set). Si el ejercicio es de autocarga (todo a 0 kg), el gráfico cambia automáticamente a **reps máximas por sesión**. El eje X son las sesiones ordenadas por fecha (proxy de semanas con etiquetas de fecha reales).

## Piezas

- `lib/progress.ts` (puro, testeado):
  - `listTrackedExercises(history)` → `{ exerciseId, exerciseName, sessions }[]` ordenado por nº de sesiones desc, empate → más reciente primero.
  - `buildProgressSeries(history, exerciseId)` → `{ date, topWeightKg, topReps, totalVolumeKg }[]` ascendente por fecha. `topReps` = reps del set con más peso (o máximo de reps si todo a 0).
  - `workoutMuscles(log)` → músculos únicos en orden de aparición.
- `components/ProgressChart.tsx`: SVG puro. 1 punto → punto + hint "completa más sesiones"; ≥2 → línea con área degradada, puntos, etiquetas min/max en Y y primera/última fecha en X.
- `components/HistoryView.tsx`: stats agregadas (entrenos, volumen acumulado), selector de ejercicio + `ProgressChart`, lista de entrenamientos (fecha es-ES, split, objetivo, volumen, badges de músculos) del más reciente al más antiguo.
- `App.tsx`: estado `view`, botón de entrada en home, `HistoryView` recibe `history` de `useWorkout` (que ya expone `useHistory`).
- CSS: clases `.history-*` y `.progress-chart*` en `index.css` siguiendo los patrones glass/badge existentes.

## Fuera de alcance

- Persistencia server-side del historial (Fase 3, requiere auth).
- Agregación real por semana ISO (las sesiones equiespaciadas con fechas visibles cumplen el objetivo de lectura de tendencia).
- Filtros por grupo muscular o rango de fechas.
