# ARCHITECTURE CONTEXT & MASTER PROMPT: FIT-POKÉAPI
## Sistema Inteligente de Generación Dinámica de Rutinas de Gimnasio

Actúa como un **Arquitecto de Software Principal y Desarrollador Full-Stack Senior**. Este documento contiene las especificaciones técnicas, reglas de negocio y la hoja de ruta para construir la aplicación. Sigue estas directrices estrictamente.

---

## 1. VISIÓN DEL PRODUCTO
El usuario llega al gimnasio sin saber qué hacer. Abre la app en su móvil, selecciona el bloque anatómico del día, su objetivo actual, y el sistema le genera instantáneamente una rutina completa optimizada y gamificada (estilo *PokéAPI*). 

### Flujo de Usuario Core:
1. **Entrada:** Selección de split (`Tren Superior`, `Tren Inferior`, `Full Body`) + Objetivo (`Perder Peso`, `Volumen`, `Mantenerse Activo`) + Perfil biofísico (`peso`, `altura`, `edad`, `sexo`, `experiencia`).
2. **Generación:** Respuesta instantánea de la API con una rutina estructurada de 5 a 6 bloques + calentamiento específico + vuelta a la calma.
3. **Interacción:** El usuario puede hacer "Re-roll" (cambiar) un ejercicio específico de forma aleatoria si no le gusta o la máquina está ocupada, sin alterar el resto de la tabla.
4. **Registro:** El usuario registra pesos reales, repeticiones y RPE por serie. Al finalizar ve un resumen de volumen total, series completadas y RPE medio.

---

## 2. STACK TECNOLÓGICO
* **Frontend:** React.js con **Vite** y **TypeScript**. Arquitectura basada en componentes funcionales y custom hooks (`useWorkout`, `useStreak`, `useRestTimer`) para separación de responsabilidades.
* **Backend:** **Node.js** con TypeScript (Express). Estructura limpia basada en Capas (Rutas → Controladores → Servicios → Repositorios). Validación de inputs con **Zod**.
* **Base de Datos:** JSON estático emulando endpoints de una API pública (estilo PokéAPI). Arquitectura desacoplada mediante el patrón repositorio para migrar a **MongoDB (Mongoose)** en la Fase 3 sin tocar la capa de servicios.

---

## 3. FASE 1 — COMPLETADA ✅

### A. Algoritmo de Rutinas y Mecánica de "Re-roll"
* [x] Al recibir el split, objetivo y perfil, el backend filtra la BBDD y selecciona ejercicios por grupo muscular de forma estructurada y aleatoria.
* [x] **Re-roll:** Cada ejercicio tiene un botón de intercambio. El backend devuelve un ejercicio del **mismo grupo muscular** sin repetir los ya presentes en la rutina.

### B. Consumo y Clasificación Estilo "PokéAPI"
* [x] Ejercicios clasificados con etiquetas jerárquicas: `tren_superior`, `tren_inferior`, `ambos`.
* [x] Cada ítem contiene: `id`, `name`, `target_muscle`, `split_category`, `description`, `youtube_video_url` (formato `/embed/`), `difficulty`.
* [x] BBDD de 20 ejercicios funcional (ampliación a 50+ en Fase 1.5).

### C. UX/UI Móvil, Rendimiento y Carga Ultra-rápida
* [x] Diseño Mobile-First, modo oscuro nativo de alto contraste, tipografías nítidas (Outfit + Inter).
* [x] Spinner de carga durante generación de rutina.

### D. Módulo de Calentamiento y Vuelta a la Calma
* [x] El backend inyecta automáticamente un bloque de calentamiento específico por split y un bloque de estiramientos al final.

### E. Temporizador de Descanso
* [x] Countdown timer activado al completar una serie. Duración basada en objetivo:
  * *Perder peso:* 60 segundos
  * *Mantenerse activo:* 90 segundos
  * *Volumen / Hipertrofia:* 120 segundos

### F. Caché en LocalStorage (Modo Offline)
* [x] La rutina activa se persiste en LocalStorage. Si la página se refresca o pierde conexión, el entrenamiento no se pierde.
* [x] Generación offline de emergencia si el servidor no responde.

### G. Registro y Gamificación
* [x] El usuario registra pesos reales, reps y RPE por serie. Al marcar una serie como completada se activa el rest timer.
* [x] Resumen de workout al finalizar: volumen total (kg), series completadas, RPE medio.
* [x] Streak de entrenamientos completados (contador simple — lógica de días consecutivos reales en Fase 1.5).

### H. Pesos Sugeridos
* [x] La API calcula un peso inicial sugerido por ejercicio basado en el `peso_kg`, `experiencia` y `sexo` del usuario mediante ratios estándar de peso corporal. Redondeo a 2.5 kg.

---

## 4. FASE 1.5 — GAPS Y MEJORAS TÉCNICAS (EN PROGRESO)

Mejoras identificadas sobre la base existente de Fase 1. Ver spec completo en `docs/superpowers/specs/2026-06-30-burnout-improvements-design.md`.

### A. Backend
* [x] Expandir `exercises.json` a 50+ ejercicios (mínimo 5-6 por grupo muscular) — ampliado a 150 (50 por categoría)
* [ ] Validación de inputs con Zod en todos los endpoints
* [ ] Filtrado por dificultad en el algoritmo de generación
* [ ] `crypto.randomUUID()` para IDs de rutina (reemplaza `Math.random()`)

### B. Estado y Lógica
* [ ] Extraer `useWorkout`, `useStreak`, `useRestTimer` de `App.tsx`
* [ ] Streak real por días consecutivos con fecha en LocalStorage (`fit_poke_streak_v2`)

### C. UI
* [ ] Inline styles → clases CSS semánticas
* [ ] `ConfirmModal` custom (reemplaza `window.confirm`)
* [ ] `ExerciseCardSkeleton` con shimmer animado

---

## 5. FASE 2 — PROGRESIÓN AVANZADA (PRÓXIMA)

### A. Algoritmo de Progresión Automática
* El sistema llevará historial de pesos levantados por ejercicio y sugerirá progresión lineal o por doble progresión (más reps → más peso).
* Esquemas de series × repeticiones adaptativos según objetivo y semana de entrenamiento.

### B. Perfil Extendido
* Historial de entrenamientos con fecha, volumen total y grupos musculares trabajados.
* Visualización de progreso por ejercicio (gráfico de peso vs. semanas).

> ✅ COMPLETADO (2026-07-08): vista "Historial y Progreso" en el frontend con stats agregadas, gráfico SVG de progreso por ejercicio (peso del top set por sesión; reps si es autocarga) y listado de entrenamientos con fecha, volumen y músculos. Design doc: `docs/superpowers/specs/2026-07-08-fase-2b-graficos-design.md`.

---

## 6. FASE 3 — INFRAESTRUCTURA (FUTURA)

* **MongoDB + Mongoose:** El patrón repositorio (`IExerciseRepository`) está diseñado para hacer el swap sin tocar la capa de servicios. Solo requiere implementar `MongoExerciseRepository`.
* **Autenticación:** JWT o sesiones para persistir historial por usuario.
* **PWA:** Service worker + manifest para instalación nativa en móvil y offline completo.

> ✅ COMPLETADO (2026-07-08): `MongoExerciseRepository` + `HybridExerciseRepository` (fallback a JSON sin conexión), seed idempotente en cada arranque, auth JWT (bcrypt + tokens 30d) con historial por usuario en `/api/history` sincronizado con el localStorage, y PWA instalable (vite-plugin-pwa, manifest + service worker + iconos). Requiere `MONGO_URI` y `JWT_SECRET` en Render. Design doc: `docs/superpowers/specs/2026-07-08-fase-3-infraestructura-design.md`.

---

## 7. FASE 4 — RETENCIÓN Y DESCUBRIBILIDAD (FUTURA)

### A. Gamificación Avanzada
* Rachas de días, medallas por volumen total levantado, logros por ejercicio dominado.
* Sistema de niveles basado en experiencia acumulada.

### B. SEO/SEM
* Metadatos semánticos dinámicos y JSON-LD para indexar fichas de ejercicios.
* URLs canónicas por ejercicio para posicionamiento orgánico.

> ✅ COMPLETADO (2026-07-08): 21 medallas en 4 grupos (volumen, entrenos, rachas, maestría), niveles por XP con 11 títulos y barra de progreso, badge de nivel en header; 150 fichas estáticas en `/ejercicios/<slug>/` con JSON-LD (ExercisePlan + BreadcrumbList), canónicas, índice, sitemap.xml (152 URLs) y robots.txt generados en el build. Design doc: `docs/superpowers/specs/2026-07-08-fase-4-gamificacion-seo-design.md`.

---

## 8. ORQUESTACIÓN MULTI-AGENTE (SUB-AGENTES)

El código está estructurado en módulos e interfaces limpias para que los siguientes sub-agentes puedan auditar y extender sin conflictos:

1. **Agente CAFYD (Experto Fitness):** Valida combinaciones biomecánicas. Evita saturar grupos musculares en una sola sesión (ej: manguito rotador en tren superior + ambos).
2. **Agente UX/UI:** Supervisa jerarquía visual, skeleton states, micro-animaciones y accesibilidad WCAG AA.
3. **Agente de Gamificación:** Diseña sistemas de retención (rachas, medallas, streaks sociales).
4. **Agente SEO/SEM:** Estructura metadatos y JSON-LD para indexar fichas de ejercicios.

---

## 9. CONTRATO DE DATOS

### Exercise
```json
{
  "id": "ex-101",
  "name": "Press de Banca con Barra",
  "target_muscle": "Pecho",
  "split_category": "tren_superior",
  "youtube_video_url": "https://www.youtube.com/embed/gRVjAtPip0Y",
  "difficulty": "intermediate",
  "description": "Descripción técnica del movimiento."
}
```

### StreakData (LocalStorage — key: `fit_poke_streak_v2`)
```ts
interface StreakData {
  count: number;
  lastWorkoutDate: string; // formato "YYYY-MM-DD"
}
```

### WorkoutRoutine
```ts
interface WorkoutRoutine {
  id: string;               // crypto.randomUUID()
  split: SplitLabel;
  goal: GoalLabel;
  warmup: string[];
  exercises: WorkoutExercise[];
  cooldown: string[];
  createdAt: string;        // ISO 8601
  isCompleted: boolean;
}
```

### RoutineSet (tracking por serie)
```ts
interface RoutineSet {
  setIndex: number;
  suggestedReps: number;
  suggestedWeightKg: number;
  completedReps?: number;      // registrado por el usuario
  completedWeightKg?: number;  // registrado por el usuario
  completedRpe?: number;       // escala 1-10
}
```
## BIBLIOTECA DE EJERCICIOS ##

Debe haber minimo 90 ejercicios de cada tipo y ademas que el usuario pueda decidir si hacerlo con material del gimnasio o sin material. 90 ejercicios de cada tipo y ademas 90 ejercicios sin material. busca burpees, pliometrias, carreras, bulgaras etc.

Puede haber carrera y/o calistenia tambien.

> ✅ COMPLETADO (2026-07-08): 150 ejercicios (50 por categoría: `tren_superior`, `tren_inferior`, `ambos`), campo `equipment` (`gym`/`none`) en cada ejercicio, selector "Gimnasio / Sin material" en el formulario de perfil, y ejercicios de carrera (`Cardio`) y calistenia (`Full Body`) en la categoría `ambos`.



## Interfaz visual ##

el logo de video, debe ser el logo de youtube, respetanto los tamaños

## FASE 2 ##

- Se suprimen los ejercicios por avanzado, intermedio o principiante. te puede tocar cualquier ejercicio. si no te gusta le das a cambiar y ya esta. Se quita tambien del index avanzado medio o principiante. 

- Debe llevar un sweetAlert2 indicando que BurnOut No sustituye el trabajo de un entrenador y que lo utilices bajo tu responsabilidad. pon que los desarrolladores con este aviso quedan exentos de responsabilidad y para pasar el sweetalert2 que haya que pinchar un boton que ponga "lo entiendo y lo acepto".

- Debe haber un area cliente. los roles seran en MongoDB como "user" o como "admin". esos roles los asignaré yo manualmente en la propia BBDD.
En el area de cliente podras ver tus entrenamientos hechos y tus ejercicios marcados como favoritos. Si estas registrado y has hecho login, podras marcar con una estrella tus ejercicios favoritos.
En ese mismo area cliente podras ver cuantas repeticiones y con cuanto peso y que RPE tuviste en el entrenamiento anterior. 


- Ha habido cambios en la linea 184. ahora son 90 ejercicios. se creativo y consulta las BBDD que consideres oportunas