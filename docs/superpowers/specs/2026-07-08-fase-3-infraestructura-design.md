# Fase 3 — Infraestructura: MongoDB, Auth JWT y PWA (Design)

**Fecha:** 2026-07-08
**Origen:** `contextburn.md` §6 — MongoDB+Mongoose vía patrón repositorio, autenticación para historial por usuario, PWA instalable.

## Decisiones

1. **MongoDB con fallback JSON.** `HybridExerciseRepository` usa Mongo cuando hay conexión y la colección tiene datos; si no, cae al JSON estático. La capa de servicios no cambió ni una línea (el swap prometido por el patrón repositorio).
2. **JSON sigue siendo la fuente de verdad de ejercicios.** En cada arranque con conexión, `syncExercisesToDb()` hace upserts idempotentes desde `exercises.json`: un deploy con ejercicios nuevos actualiza la BBDD solo. También existe `npm run seed` manual.
3. **Auth JWT stateless** (30 días, HS256 con `JWT_SECRET`), contraseñas con bcryptjs (salt 10). Login y registro devuelven el mismo 401/409 sin filtrar qué emails existen. Sin refresh tokens: para una app de gimnasio personal, re-login mensual es aceptable.
4. **Historial en nube como espejo del local.** localStorage sigue siendo la verdad primaria (la app funciona 100% anónima y offline). Con sesión: al iniciar se baja el historial remoto y se fusiona (`mergeHistories`: dedup por id, gana lo local, orden por fecha, cap 100); después, cada cambio local se sube completo con PUT (documento único por usuario — simple, idempotente, sin conflictos de merge en servidor).
5. **Sin DB los endpoints de auth/historial devuelven 503** (`requireDb`), nunca rompen: el deploy de Render funciona aunque falten las env vars.
6. **PWA con vite-plugin-pwa** (generateSW, autoUpdate): precache del build completo + Google Fonts en runtime. La API no se cachea — el modo offline de rutinas ya lo resuelve el fallback local de `useWorkout`. Iconos generados desde el favicon (rayo púrpura sobre fondo oscuro), incl. maskable y apple-touch-icon.

## Piezas

- Backend: `db/connection.ts`, `db/seed.ts`, `models/{exercise,user,history}.model.ts`, `repositories/{mongo,hybrid}ExerciseRepository.ts`, `services/authService.ts` (funciones puras testeadas), `middleware/{requireAuth,requireDb}.ts`, `controllers/{auth,history}Controller.ts`, rutas `/api/auth/{register,login}` y `/api/history` (GET/PUT con Bearer), `scripts/seed.ts`.
- Frontend: `lib/api.ts` (API_ROOT derivada de la URL existente), `hooks/useAuth.ts` (localStorage `fit_poke_auth_v1`), sync en `useHistory(token)`, `AuthPanel` en la home, `vite.config.ts` con manifest + workbox, iconos en `public/`.

## Variables de entorno (Render — configurar en dashboard)

- `MONGO_URI` — cadena de conexión Atlas (en `backend/.env` local, NUNCA en git).
- `JWT_SECRET` — cadena aleatoria larga (≥48 bytes hex).

## Verificado

- 40 tests backend + 16 frontend, tsc limpio en ambos.
- E2E real contra Atlas: seed 150 ejercicios, generate con repo Mongo, register (201) / duplicado (409) / login mal (401) / login ok (200), PUT+GET historial con token, 401 sin token y con token manipulado.

## Fuera de alcance

- Refresh tokens / recuperación de contraseña.
- Migrar el historial local automáticamente al crear cuenta en otro dispositivo (el merge ya lo cubre al iniciar sesión).
- Notificaciones push.
