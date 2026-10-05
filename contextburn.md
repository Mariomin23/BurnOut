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
* **Base de Datos:** **MongoDB Atlas (Mongoose)** con `exercises.json` como fuente de verdad (seed en cada arranque) y fallback automático al JSON si no hay conexión (`HybridExerciseRepository`, patrón repositorio). El catálogo se cachea 10 min en memoria.
* **Despliegue:** frontend en **Vercel** (burnout.minuesa.es), backend en **Render** (plan free, se duerme sin tráfico). Push a `main` despliega ambos.

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
  > Sustituido en 2026-10 por las reglas de `repes.md` (ver sección "FASE 5").

---

## 4. FASE 1.5 — GAPS Y MEJORAS TÉCNICAS (COMPLETADA salvo inline styles)

Mejoras identificadas sobre la base existente de Fase 1. Ver spec completo en `docs/superpowers/specs/2026-06-30-burnout-improvements-design.md`.

### A. Backend
* [x] Expandir `exercises.json` a 50+ ejercicios (mínimo 5-6 por grupo muscular) — ampliado a 150 (50 por categoría)
* [x] Validación de inputs con Zod en todos los endpoints
* [~] Filtrado por dificultad en el algoritmo de generación — descartado: la Fase 2 suprime la dificultad (cualquier ejercicio puede tocar)
* [x] `crypto.randomUUID()` para IDs de rutina (reemplaza `Math.random()`)

### B. Estado y Lógica
* [x] Extraer `useWorkout`, `useStreak`, `useRestTimer` de `App.tsx` (más `useAuth`, `useHistory`, `useFavorites`, `useProfile`)
* [x] Streak real por días consecutivos con fecha en LocalStorage (`fit_poke_streak_v2`)

### C. UI
* [ ] Inline styles → clases CSS semánticas — **pendiente** (`App.tsx`, `ClientArea.tsx`, `RestTimer.tsx` y otros)
* [x] `ConfirmModal` custom (reemplaza `window.confirm`)
* [x] `ExerciseCardSkeleton` con shimmer animado

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

> ✅ COMPLETADO (2026-07-08): `MongoExerciseRepository` + `HybridExerciseRepository` (fallback a JSON sin conexión), seed idempotente en cada arranque, auth JWT (bcrypt + tokens 30d; desde 2026-10 son 7d y revocables, ver "FASE 5") con historial por usuario en `/api/history` sincronizado con el localStorage, y PWA instalable (vite-plugin-pwa, manifest + service worker + iconos). Requiere `MONGO_URI` y `JWT_SECRET` en Render. Design doc: `docs/superpowers/specs/2026-07-08-fase-3-infraestructura-design.md`.

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

### WorkoutExercise
```ts
interface WorkoutExercise {
  exercise: Exercise;
  sets: RoutineSet[];          // 2-5 según nivel y objetivo
  restTimerSeconds: number;
  progressionDirection?: 'up' | 'keep' | 'down';  // solo con historial
  targetRpe?: number;          // 8 carga calculada, 9 autocargas duras
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

- Debe haber un area cliente. los roles seran en2 MongoDB como "user" o como "admin". esos roles los asignaré yo manualmente en la propia BBDD.
En el area de cliente podras ver tus entrenamientos hechos y tus ejercicios marcados como favoritos. Si estas registrado y has hecho login, podras marcar con una estrella tus ejercicios favoritos.
En ese mismo area cliente podras ver cuantas repeticiones y con cuanto peso y que RPE tuviste en el entrenamiento anterior. 


- Ha habido cambios en la linea 184. ahora son 90 ejercicios. se creativo y consulta las BBDD que consideres oportunas

- Creamos un boton visible de login y logout
- Creamos un timeout sesion de una hora. si el usuario no interactua en 30 min con la app, se cierra la sesion automaticamente
- dale una mejora a la ciberseguridad

## FASE 3 ##

Vamos a meterle un super update, te voy a meter un source de github con mas de mil ejercicios. a parir de ahora los ejericios iran acompañados de un gif a la derecha que sacaras del source de github. ten en cuenta que hay que clasificar la zona por tren superior, tren inferior o full body. con o sin material. 

el source es este: https://github.com/hasaneyldrm/exercises-dataset.git

> ✅ COMPLETADO (2026-07-15): 1,324 ejercicios con GIF animado importados de hasaneyldrm/exercises-dataset. GIF 90×90 en header de ExerciseCard, lazy-loaded. Mapeo body_part→split_category y target→target_muscle alineado con routineService.ts. Seed limpia ejercicios obsoletos de MongoDB en cada deploy.

## FASE 4 ##

- El usuario podra elegir crear una rutina a partir de sus favoritos. para ello debe haber seleccionado minimo 5 favoritos

- Habra un buscador de ejercicios para meter en favoritos. La idea es crear rutinas personalizadas.
- Siempre se quedara guardado el numero de repeticiones que hiciste la ultima vez que tocaste ese ejercicio. Tambien la api te dira con cuanto peso tiraste. 

- El usuario podra subir una foto de perfil. 

- En el SweetAlert2 habra un aviso que diga que posiblemente tarde entre 30 y 40 segundos en cargar por primera vez debido al coldStart del server. te dejo explicarselo como tu quieras al usuario, que sea facil y sin dar detalle de si es un server gratuito o no.

- En el footer podra: Diseñado por Mario Minuesa y mi correo: mailto:"mario@minuesa.es"

> ✅ COMPLETADO (2026-07-28):
> - **Rutina desde favoritos**: `POST /api/routines/from-favorites` (requiere sesión + BBDD) con mínimo de 5 favoritos; baraja y toma hasta 6, aplica progresión del historial y el calentamiento/vuelta a la calma del split elegido. Botón en el formulario de inicio y en el Área Cliente (deshabilitado con aviso si faltan favoritos).
> - **Buscador de ejercicios**: `GET /api/exercises/search?q=&equipment=&limit=` sobre los 1.324 ejercicios, insensible a mayúsculas y tildes (regex tolerante en Mongo, normalización en el JSON de fallback). Componente `ExerciseSearch` con debounce de 350 ms y estrella para marcar favoritos, dentro de la pestaña Favoritos.
> - **Última sesión por ejercicio**: peso, reps y RPE de la última vez se muestran en cada `ExerciseCard` durante el entreno (además de la prescripción que ya calculaba la API).
> - **Foto de perfil**: `GET /api/profile/me`, `PUT/DELETE /api/profile/avatar`. La imagen se recorta a 256 px y se sube como data URL (validada por Zod: solo PNG/JPEG/WebP, máx. 400 KB de base64, parser dedicado de 600 KB y rate-limit propio). Se ve en la cabecera y en la nueva pestaña "Perfil" del Área Cliente.
> - **Aviso de cold start** añadido al SweetAlert2 del disclaimer (30-40 s la primera rutina, sin mencionar el tipo de hosting).
> - **Footer**: "Diseñado por Mario Minuesa" + mailto:mario@minuesa.es.

## FASE 5 — RENDIMIENTO, PROGRESIÓN Y SEGURIDAD ##

Origen: "la página va muy lenta", el documento `repes.md` (reglas de carga) y un repaso de seguridad sobre el grafo de graphify.

> ✅ COMPLETADO (2026-10-06), todo desplegado en producción:
>
> **Rendimiento**
> - **Arranque en frío**: el servidor abre el puerto antes del seed (1.324 upserts), que corre en segundo plano. Apagado limpio con `SIGTERM`. `/health` informa de `db: mongo|json`.
> - **Catálogo en memoria** (10 min) en `HybridExerciseRepository`: generar rutina o hacer re-roll ya no lee los 1.324 ejercicios de Atlas en cada petición (~0,25 s por rutina en caliente).
> - **Aviso de arranque**: la app hace ping a `/health` al abrirse; si el servidor tarda más de 2,5 s sale un toast SweetAlert2 no bloqueante ("Arrancando el servidor… puede tardar hasta un minuto") que se cierra solo. Se descartó un cron de keep-alive para no gastar las horas del plan free de Render.
> - **Scroll y tecleo**: sin `backdrop-filter` en tarjetas y botones; la marca de actividad de sesión se escribe como mucho cada 15 s (antes en cada scroll); `ExerciseCard` con `React.memo` y handlers estables; el re-roll ya no pisa series anotadas mientras espera.
> - **Carga inicial**: bundle de 334 kB a ~240 kB; SweetAlert2 e Historial / Área Cliente / Admin se cargan bajo demanda (`lib/alert.ts`, `React.lazy`). Fuentes sin bloquear el pintado. GIFs cacheados 30 días por el service worker. `/assets/*` con caché inmutable (`frontend/vercel.json`).
>
> **Cargas y repeticiones (`repes.md`)** — `backend/src/services/progressionService.ts`
> - **Primera sesión**: 1RM teórico = peso corporal × multiplicador (sentadilla/peso muerto 1,5; press banca 1,0; bíceps, tríceps y hombro 0,25) × edad (18-35 → 1,0; 36-50 → 0,9; >50 y <18 → 0,8) × nivel (0,7 / 1,0 / 1,3). Peso de trabajo al 70 % (65 % en el rango 12-15), redondeado hacia abajo a 2,5 kg, con "RPE objetivo 8".
> - **Solo básicos**: variantes pliométricas, unilaterales, de equilibrio, combinadas o con polea no heredan la carga del básico. Con mancuernas/kettlebells la carga se reparte por mano. Los ejercicios que la tabla no cubre (espalda, gemelos, prensa…) siguen en blanco la primera vez: 425 de 857 ejercicios con carga quedan cubiertos.
> - **Sexo**: en mujeres ×0,75 en tren inferior y ×0,6 en superior (aproximación propia, no viene de `repes.md`).
> - **Autocargas duras** (dominadas, fondos, muscle-up, pistol, planchas): con más de 85 kg, principiante o más de 40 años pasan a 3-5 reps con "RPE objetivo 9" (5, 4 o 3 reps según cuántas condiciones se cumplan).
> - **Autorregulación**: con la última sesión se estima el 1RM real (Epley + reps en reserva según el RPE). Si la carga estaba descalibrada más de un 15 % se salta al peso calibrado (tope +20 % por sesión); si no, sigue la doble progresión. Al cambiar de objetivo se recalcula el peso para el rango nuevo.
> - **Series por nivel**: principiante 2-3, intermedio 3-4, avanzado 4-5 (Volumen usa la cifra alta).
> - No implementado: objetivo "Fuerza" (3-5 reps al 85 %), la app no tiene ese objetivo.
>
> **Objetivos y material**
> - **Tres objetivos diferenciados** (`GOAL_PROFILE` en `progressionService.ts`; en la interfaz Hipertrofia / Salud / Definir, internamente `Volumen` / `Mantenerse Activo` / `Perder Peso`): Hipertrofia 8-12 reps, 70 %, RPE 8, 120 s de descanso y una serie más; Salud 10-12 reps, 60 %, RPE 7, 90 s; Definir 12-15 reps, 65 %, RPE 8, 60 s. El formulario explica la diferencia bajo el selector.
> - **Material sin mezclas**: "Gimnasio" solo usa ejercicios `gym` y "Sin material" solo `none` (antes Gimnasio incluía todo el catálogo). Aplica a rutina y re-roll; la rutina de favoritos usa lo que el usuario haya elegido.
> - **Catálogo reclasificado** (`backend/src/data/equipmentRules.ts`): 138 ejercicios que necesitan aparato (gomas, barra de dominadas, paralelas, anillas, suspensión, rodillo, máquina) pasan de "Sin material" a "Gimnasio". Suelo, pared, banco/silla, escalón y toalla siguen contando como sin material. Pino, flexión en pino y flexión pica-cobra se reasignan a Hombros.
>
> **Seguridad**
> - **Rate limit**: 300 peticiones / 15 min por IP en `/api`, 60 / 5 min en el buscador, 10 / 15 min en `/api/auth`.
> - **Sesiones**: tokens de 7 días (antes 30), HS256 fijado, con `tokenVersion` en el usuario. `requireAuth` comprueba en BBDD que el usuario existe y que el token no está revocado. `POST /api/auth/logout-all` + botón "Cerrar sesión en todos los dispositivos" en Perfil. Un 401 cierra la sesión local con aviso (`authFetch`).
> - **Cabeceras en Vercel**: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. La CSP no admite scripts inline: cualquier dominio nuevo (API, imágenes, fuentes) hay que añadirlo en `frontend/vercel.json`.
> - **Favoritos**: se valida formato e existencia del ejercicio, tope de 200 por usuario.
> - **API**: CORS sin `credentials` y sin 500 para orígenes ajenos; límite de body por grupo de rutas (perfil 600 kb, historial 200 kb, rutinas 50 kb, resto 10 kb); errores de body siempre en JSON; `npm audit` de producción a 0.

### Pendiente tras la Fase 5

- [ ] Inline styles → clases CSS (único resto de la Fase 1.5).
- [ ] "Sin material" tiene pocos ejercicios de bíceps (2) y hombro (5, dos de ellos flojos); el catálogo incluye estiramientos que salen como ejercicio con series y reps.
- [ ] Factor femenino de tren superior (0,6): da 2,5 kg en aislamiento a una principiante de 60 kg; revisar.
- [ ] Sentadilla goblet: usa una sola mancuerna y hereda la mitad de la sentadilla con barra; queda alta.
- [ ] Historial last-write-wins entre dispositivos (`PUT /api/history` reemplaza todo).
- [ ] CI: el workflow "Deploy to Render" falla (secreto `RENDER_DEPLOY_HOOK_URL` vacío; Render despliega solo) y no se ejecutan tests antes del deploy. Dependabot desactivado y `main` sin protección.
- [ ] CORS acepta cualquier `*-marios-projects-*.vercel.app`; fijar al slug exacto del equipo de Vercel.
- [ ] Vulnerabilidades solo de desarrollo (`nodemon` y toolchain de frontend): requieren `npm audit fix --force`.
- [ ] Tests de controladores, middleware (`requireAuth`) y hooks (`useAuth`, `useWorkout`).
- [ ] GIFs siguen hotlinkeados a `raw.githubusercontent.com`; migrar a storage propio.
- [ ] RGPD: borrado de cuenta, exportación de datos y política de privacidad.
- [ ] Cuenta de prueba `claude-test-1791240329@example.com` en Atlas: borrar.
