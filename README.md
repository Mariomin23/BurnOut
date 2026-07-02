# 🔥 BurnOut — Smart Gym Routine Generator

> Open the app at the gym, pick your training split and goal, and get an instant, personalized workout — with suggested weights, rest timers, set-by-set tracking and automatic progression.

**🌐 Live demo: [burnout.minuesa.es](https://burnout.minuesa.es)** · No sign-up required, works on mobile.

<!-- TODO: add a screenshot or short GIF here — docs/screenshot.png -->

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## What it does

1. **Input** — You select a split (*Upper Body*, *Lower Body*, *Full Body*), a goal (*Fat Loss*, *Hypertrophy*, *Stay Active*) and your biophysical profile (weight, height, age, sex, experience).
2. **Generation** — The API builds a structured routine: warm-up → 5–6 exercise blocks → cooldown, drawn from a library of **56 classified exercises** with video demos.
3. **Smart defaults** — Starting weights are calculated per exercise from your body weight, sex and experience using standard strength ratios, rounded to 2.5 kg plates.
4. **Training** — You log real weight, reps and RPE per set. Completing a set fires a rest timer tuned to your goal (60/90/120 s). Don't like an exercise or the machine is busy? **Re-roll** swaps it for another one targeting the same muscle group, without touching the rest of the routine.
5. **Progression** — Workout history is persisted and fed back to the API: the next routine applies **double progression** (more reps → more weight) per exercise, and the UI shows a progression direction badge on each card.

Also: workout summary (total volume, completed sets, average RPE), training streak, and **offline mode** — the active routine survives refreshes and connection loss via LocalStorage, with emergency client-side generation if the server is unreachable.

## Engineering highlights

The parts I'd want you to look at as a reviewer:

- **Layered backend architecture** — `Routes → Controllers → Services → Repositories`, with dependency injection at composition time ([`routineRoutes.ts`](backend/src/routes/routineRoutes.ts)). Business logic lives in services and is framework-agnostic.
- **Repository pattern for a painless DB migration** — exercises are currently served from static JSON behind an `IExerciseRepository` interface. Swapping in MongoDB (planned Phase 3) means writing one new repository class; the service layer doesn't change.
- **Input validation with Zod** — every endpoint validates its payload against a schema before it reaches business logic ([`userProfile.schema.ts`](backend/src/schemas/userProfile.schema.ts)).
- **34 automated tests** (28 backend + 6 frontend, Vitest) covering the routine generation algorithm, the progression engine and the history logic. Core logic is written as **pure functions** ([`frontend/src/lib/history.ts`](frontend/src/lib/history.ts)) precisely so it can be tested without mocking React or Express.
- **Custom hooks for separation of concerns** — `useWorkout`, `useStreak`, `useRestTimer`, `useHistory` keep `App.tsx` declarative and each concern independently testable.
- **Shared domain types** — the `WorkoutRoutine` / `RoutineSet` contracts are typed end to end in TypeScript on both sides of the API.

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/routines/generate` | Generate a routine from split + goal + user profile (+ workout history for progression) |
| `POST` | `/api/routines/reroll` | Replace one exercise with another from the same muscle group, excluding those already in the routine |

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, custom hooks, CSS (mobile-first, dark mode) |
| Backend | Node.js, Express, TypeScript, Zod |
| Testing | Vitest (backend + frontend) |
| Data | Static JSON behind a repository interface (MongoDB-ready) |
| Deploy | Vercel (frontend, custom domain) + Render (Express API) |

## Run it locally

```bash
git clone https://github.com/Mariomin23/BurnOut.git
cd BurnOut
npm run install:all   # installs backend + frontend deps
npm run dev           # starts API and Vite dev server together
```

Run the tests:

```bash
npm test --prefix backend    # 28 tests
npm test --prefix frontend   # 6 tests
```

## Roadmap

- ✅ **Phase 1** — Routine generation, re-roll, rest timer, suggested weights, offline mode, streaks
- ✅ **Phase 2A** — Workout history + automatic double-progression algorithm
- 🔜 **Phase 2B** — Progress charts per exercise (weight vs. weeks)
- 🔮 **Phase 3** — MongoDB + auth (JWT) for per-user history, full PWA

## About

Built by **Mario Minuesa** ([@Mariomin23](https://github.com/Mariomin23)) as a full-stack portfolio project: product design, architecture, implementation, testing and deployment, end to end.
