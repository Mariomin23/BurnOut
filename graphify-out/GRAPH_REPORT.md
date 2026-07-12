# Graph Report - .  (2026-07-12)

## Corpus Check
- 90 files · ~55,534 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 555 nodes · 885 edges · 37 communities (35 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Exercise Data & Models
- Achievements & History UI
- Exercise Card & User Profile UI
- Frontend Dependencies
- App Entry & Auth UI
- Backend Dependencies
- Frontend TypeScript Config
- Backend App & Database
- Auth Controller & Middleware
- Frontend TS Node Config
- Backend Dev Dependencies
- History Controller & Model
- Routine Controller & Generator
- Backend TypeScript Config
- Design Contracts & Specs
- SEO Page Generator
- Gamification & Streaks
- App Branding & README
- Progression Design Specs
- Phase 1.5 Improvements
- Core Exercise Contracts
- Frontend Linting Config
- App Screenshots & UI Visuals
- Icon Sprite Assets
- Phase 2 Progression & Charts
- Phase 3 Infrastructure & Auth
- HTML Entry & Favicon
- Root Package Config
- PWA Apple Touch Icon
- PWA Icon 192px
- PWA Icon 512px
- PWA Maskable Icon
- Hero Image Asset
- React Logo Asset
- Frontend TSConfig Root
- Vite Asset

## God Nodes (most connected - your core abstractions)
1. `Exercise` - 24 edges
2. `compilerOptions` - 18 edges
3. `react` - 17 edges
4. `BurnOut — Smart Gym Routine Generator` - 16 edges
5. `compilerOptions` - 15 edges
6. `RoutineService` - 14 edges
7. `compilerOptions` - 11 edges
8. `IExerciseRepository` - 10 edges
9. `WorkoutLog` - 10 edges
10. `BurnOut Hero Banner` - 10 edges

## Surprising Connections (you probably didn't know these)
- `BurnOut — Smart Gym Routine Generator` --semantically_similar_to--> `Fit-PokéAPI Product Vision (instant gamified gym routine generation)`  [INFERRED] [semantically similar]
  README.md → contextburn.md
- `Zod Input Validation at Every Endpoint` --semantically_similar_to--> `UserProfileSchema (Zod) for API Payload Validation`  [INFERRED] [semantically similar]
  README.md → docs/superpowers/specs/2026-06-30-burnout-improvements-design.md
- `Custom Hooks for Separation of Concerns (useWorkout, useStreak, useRestTimer, useHistory)` --semantically_similar_to--> `Hook Extraction from Monolithic App.tsx (useWorkout, useStreak, useRestTimer)`  [INFERRED] [semantically similar]
  README.md → docs/superpowers/specs/2026-06-30-burnout-improvements-design.md
- `SPA HTML Shell (index.html) with SEO metadata and canonical burnout.minuesa.es` --conceptually_related_to--> `BurnOut — Smart Gym Routine Generator`  [INFERRED]
  frontend/index.html → README.md
- `Double Progression (more reps → more weight)` --semantically_similar_to--> `Double Progression Auto-regulated by RPE`  [INFERRED] [semantically similar]
  README.md → docs/superpowers/specs/2026-07-02-fase-2a-progresion-design.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **BurnOut Phased Roadmap (Fase 1.5 → 2 → 3 → 4)** — contextburn_fase_1_5, contextburn_fase_2_progresion, contextburn_fase_3_infraestructura, contextburn_fase_4_gamificacion_seo [EXTRACTED 1.00]
- **LocalStorage-first Persistence Strategy (streak, history, offline routine, cloud mirror)** — contextburn_streakdata_contract, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_history_localstorage, readme_offline_mode, docs_superpowers_specs_2026_07_08_fase_3_infraestructura_design_cloud_history_mirror [INFERRED 0.85]
- **Automatic Progression Flow (history → summary → prescription → bias → badge)** — docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_history_summary_transport, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_progressionservice, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_double_progression_rpe, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_goal_rep_ranges, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_selection_bias_70_30, docs_superpowers_specs_2026_07_02_fase_2a_progresion_design_progression_badge [EXTRACTED 1.00]

## Communities (37 total, 2 thin omitted)

### Community 0 - "Exercise Data & Models"
Cohesion: 0.07
Nodes (36): DIFF_POOL, exercises, SLOTS, ExerciseModel, exerciseSchema, exercises, IExerciseRepository, JsonExerciseRepository (+28 more)

### Community 1 - "Achievements & History UI"
Cohesion: 0.09
Nodes (28): AchievementsSection(), AchievementsSectionProps, formatWorkoutDate(), HistoryView(), HistoryViewProps, formatDate(), ProgressChart(), ProgressChartProps (+20 more)

### Community 2 - "Exercise Card & User Profile UI"
Cohesion: 0.12
Nodes (30): DIFFICULTY_LABEL, ExerciseCard(), ExerciseCardProps, UserProfileForm(), UserProfileFormProps, useHistory(), buildOfflineRoutine(), useWorkout() (+22 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, react, react-dom, devDependencies, oxlint, @types/node, @types/react, @types/react-dom (+26 more)

### Community 4 - "App Entry & Auth UI"
Cohesion: 0.13
Nodes (20): App(), AuthPanel(), AuthPanelProps, ConfirmModal(), ConfirmModalProps, ExerciseCardSkeleton(), RestTimer(), RestTimerProps (+12 more)

### Community 5 - "Backend Dependencies"
Cohesion: 0.07
Nodes (28): author, dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, mongoose (+20 more)

### Community 6 - "Frontend TypeScript Config"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 7 - "Backend App & Database"
Cohesion: 0.19
Nodes (13): app, connectDB(), disconnectDB(), isDbConnected(), syncExercisesToDb(), requireDb(), controller, router (+5 more)

### Community 8 - "Auth Controller & Middleware"
Cohesion: 0.19
Nodes (14): AuthController, Express, Request, requireAuth(), UserDoc, UserModel, userSchema, CredentialsSchema (+6 more)

### Community 9 - "Frontend TS Node Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 10 - "Backend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, nodemon, ts-node, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken, @types/node (+11 more)

### Community 11 - "History Controller & Model"
Cohesion: 0.15
Nodes (12): HistoryController, exerciseLogSchema, HistoryDoc, HistoryModel, historySchema, setSchema, WorkoutLogEntry, workoutLogSchema (+4 more)

### Community 12 - "Routine Controller & Generator"
Cohesion: 0.18
Nodes (9): RoutineController, exerciseRepo, routineController, routineService, validEntry, ExerciseSetLogSchema, HistorySchema, RerollRequestSchema (+1 more)

### Community 13 - "Backend TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, resolveJsonModule, rootDir (+8 more)

### Community 14 - "Design Contracts & Specs"
Cohesion: 0.14
Nodes (16): Re-roll: swap exercise within same muscle group without repeating, RoutineSet Data Contract (per-set tracking: reps, weight, RPE), WorkoutRoutine Data Contract, Double Progression Auto-regulated by RPE, Frontend README (React + TypeScript + Vite template notes), POST /api/routines/generate, POST /api/routines/reroll, BurnOut — Smart Gym Routine Generator (+8 more)

### Community 15 - "SEO Page Generator"
Cohesion: 0.15
Nodes (12): DIFFICULTY_LABEL, __dirname, DIST, EQUIPMENT_LABEL, escapeHtml(), exercises, EXERCISES_JSON, page() (+4 more)

### Community 16 - "Gamification & Streaks"
Cohesion: 0.25
Nodes (11): Fase 4 — Retention and Discoverability (gamification + SEO), StreakData Contract (localStorage key fit_poke_streak_v2), Fase 4 Design Spec — Advanced Gamification and SEO/SEM, Gamification Engine derived from History (lib/gamification.ts, pure), JSON-LD on Exercise Pages (ExercisePlan + BreadcrumbList, canonical, Open Graph), 21 Medals in 4 Groups (volume, workouts, streaks, mastery), Generated sitemap.xml (152 URLs) + robots.txt, Static Exercise SEO Pages (generate-seo-pages.mjs → dist/ejercicios/<slug>/) (+3 more)

### Community 17 - "App Branding & README"
Cohesion: 0.31
Nodes (11): BurnOut — Smart Gym Routine Generator, 56 Exercises, BurnOut Hero Banner, Live Site: burnout.minuesa.es, Plate-Rounded +2.5 kg Increments, 12-Step Progression Bar Chart (grey→ember gradient), Progressive Overload — Double Progression, Rest Timers 60/90/120 s (+3 more)

### Community 18 - "Progression Design Specs"
Cohesion: 0.27
Nodes (11): Fase 2A Implementation Plan (10 tasks, TDD, completed 2026-07-02), Fase 2A Design Spec — Automatic Progression + Workout History, GOAL_REP_RANGE (Perder Peso 12–15, Volumen 8–12, Mantenerse Activo 10–12), Workout History in localStorage (fit_poke_history_v1, WorkoutLog[], FIFO cap 100), ExerciseHistorySummary Compact Transport (last session per exercise, max 30), Progression Direction Badge (↑ up / = keep / ↓ down), ProgressionService (pure backend prescription engine), 70/30 Selection Bias Toward Exercises with History (+3 more)

### Community 19 - "Phase 1.5 Improvements"
Cohesion: 0.36
Nodes (10): Fase 1.5 — Technical Gaps and Improvements, Fase 1.5 Implementation Plan (10 tasks), ConfirmModal (replaces window.confirm), crypto.randomUUID() for Routine IDs, Difficulty Filtering in Routine Generation, Fase 1.5 Improvements Design Spec, Hook Extraction from Monolithic App.tsx (useWorkout, useStreak, useRestTimer), ExerciseCardSkeleton with Shimmer Animation (+2 more)

### Community 20 - "Core Exercise Contracts"
Cohesion: 0.22
Nodes (9): Equipment Filter (gym / none) + 150-exercise Library, Exercise Data Contract (id, name, target_muscle, split_category, youtube_video_url, difficulty, equipment), Fit-PokéAPI Product Vision (instant gamified gym routine generation), LocalStorage Cache / Offline Emergency Generation, Multi-Agent Orchestration (CAFYD fitness, UX/UI, Gamification, SEO sub-agents), PokéAPI-style Exercise Classification (tren_superior / tren_inferior / ambos), Goal-based Rest Timer (60/90/120 s), Installable PWA (vite-plugin-pwa, generateSW, autoUpdate) (+1 more)

### Community 21 - "Frontend Linting Config"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 22 - "App Screenshots & UI Visuals"
Cohesion: 0.36
Nodes (8): Bloque Anatomico (Split) Selector: Superior / Inferior / Full Body, BurnOut App Screenshot (Profile & Goal Setup), BurnOut Brand Header, Dark Mobile-First UI with Teal/Cyan Gradient Accents, Configura tu Perfil & Objetivo Form, Generar Rutina Action (Routine Generation), Objetivo Principal Selector: Definir / Hipertrofia / Salud, User Profile Inputs (Genero, Peso, Altura, Edad, Experiencia)

### Community 23 - "Icon Sprite Assets"
Cohesion: 0.50
Nodes (8): Bluesky Icon (bluesky-icon), Discord Icon (discord-icon), Documentation Icon (documentation-icon), GitHub Icon (github-icon), Icon Sprite Sheet (icons.svg), Social/Community Icon (social-icon), Social/External Link Icons Concept, X (Twitter) Icon (x-icon)

### Community 24 - "Phase 2 Progression & Charts"
Cohesion: 0.33
Nodes (7): Fase 2 — Advanced Progression (history + progress visualization), Ember Ledger Design Philosophy, Fase 2B Design Spec — Extended Profile and Progress Charts, HistoryView (aggregate stats + per-exercise chart + workout list), Local-State Navigation (view: home | history, no router), Pure SVG ProgressChart (no chart library), Top-Set Chart Metric (max weight per session; max reps if bodyweight)

### Community 25 - "Phase 3 Infrastructure & Auth"
Cohesion: 0.33
Nodes (7): Fase 3 — Infrastructure (MongoDB, JWT auth, PWA), Fase 3 Design Spec — MongoDB, JWT Auth and PWA, HybridExerciseRepository (Mongo with static-JSON fallback), Idempotent Seed — JSON stays the source of truth (syncExercisesToDb), Stateless JWT Auth (30-day HS256, bcryptjs salt 10), requireDb Middleware (503 instead of crash without DB), Repository Pattern (IExerciseRepository)

### Community 26 - "HTML Entry & Favicon"
Cohesion: 0.40
Nodes (6): Frontend index.html, BurnOut App Branding, Energy / Lightning Bolt Motif, BurnOut Favicon (Lightning Bolt Icon), Purple Brand Palette (#863bff / #7e14ff / #47bfff), Vite Config (PWA assets)

### Community 27 - "Root Package Config"
Cohesion: 0.33
Nodes (5): name, private, scripts, dev, install:all

### Community 28 - "PWA Apple Touch Icon"
Cohesion: 0.67
Nodes (4): BurnOut Apple Touch Icon, BurnOut Brand Identity (energy/fitness theme), Lightning Bolt Logo (purple on near-black), PWA / iOS Home Screen Installability

### Community 29 - "PWA Icon 192px"
Cohesion: 0.67
Nodes (4): BurnOut App Branding, Lightning Bolt Motif, PWA Icon 192x192, PWA Installability

### Community 30 - "PWA Icon 512px"
Cohesion: 0.67
Nodes (4): BurnOut App Brand Identity, Lightning Bolt Motif (purple on dark), BurnOut PWA Icon 512x512, PWA Installability (manifest icon)

### Community 31 - "PWA Maskable Icon"
Cohesion: 1.00
Nodes (3): BurnOut PWA App Branding, Lightning Bolt Logo (purple on near-black), PWA Maskable Icon 512px

### Community 32 - "Hero Image Asset"
Cohesion: 0.67
Nodes (3): Hero Image (layered platform illustration), Isometric Layered Platform Motif, Purple Brand Accent

### Community 33 - "React Logo Asset"
Cohesion: 0.67
Nodes (3): React (UI Library), React Logo (SVG), Vite React Template

## Knowledge Gaps
- **195 isolated node(s):** `name`, `version`, `description`, `main`, `build` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Entry & Auth UI` to `Achievements & History UI`, `Exercise Card & User Profile UI`, `Frontend Linting Config`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Exercise` connect `Exercise Data & Models` to `Backend App & Database`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `BurnOut — Smart Gym Routine Generator` connect `Design Contracts & Specs` to `Gamification & Streaks`, `Phase 3 Infrastructure & Auth`, `Progression Design Specs`, `Core Exercise Contracts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `BurnOut — Smart Gym Routine Generator` (e.g. with `SPA HTML Shell (index.html) with SEO metadata and canonical burnout.minuesa.es` and `Frontend README (React + TypeScript + Vite template notes)`) actually correct?**
  _`BurnOut — Smart Gym Routine Generator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Exercise Data & Models` be split into smaller, more focused modules?**
  _Cohesion score 0.0673903211216644 - nodes in this community are weakly interconnected._
- **Should `Achievements & History UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._