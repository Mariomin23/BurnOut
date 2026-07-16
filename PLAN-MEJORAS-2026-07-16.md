# Plan de Acción — Mejoras Pendientes BurnOut

> Auditoría de API (backend Express + MongoDB) y web (frontend React/Vite) — 2026-07-16.
> Estado verificado: frontend 26/26 tests OK, `tsc` OK · backend **13/42 tests FALLANDO**.

---

## P0 — Bugs y bloqueantes (hacer ya)

### 1. Arreglar los 13 tests rotos del backend
- `progressionService.test.ts` (11 fallos) y `routineService.test.ts` (2 fallos).
- Causa: el commit `5342b57` (eliminar fórmula de peso corporal — primera vez en blanco, después valores de la última sesión) cambió el comportamiento de `prescribe()` pero no se actualizaron los tests.
- Acción: actualizar las expectativas de los tests al nuevo contrato (fallback en blanco / sin sugerencia) o revisar si la implementación rompió casos que sí debían conservarse.

### 2. Límite `express.json({ limit: '10kb' })` rompe la sincronización del historial
- `PUT /api/history` envía **todo** el array de logs (hasta 100 workouts × 12 ejercicios × 12 series). Un workout típico pesa ~1.5–2.5 KB en JSON → a partir de ~5 entrenamientos el body supera 10 KB y Express responde **413**, y el historial deja de sincronizarse en la nube silenciosamente.
- Acción mínima: subir el límite a `200kb` (o aplicar un límite mayor solo en la ruta de historial).
- Acción mejor (P1.6): endpoint incremental `POST /api/history/logs` que solo añade el último workout.

### 3. Cambios locales sin commitear
- `frontend/src/App.tsx` y `frontend/src/components/ClientArea.tsx` (rediseño de la pestaña Favoritos con `onToggleFavorite` y botón de vídeo). 77 líneas añadidas, sin commit ni push → no está en producción.
- Acción: revisar, commitear y pushear.

### 4. El CI deploya sin ejecutar tests
- `.github/workflows/deploy.yml` solo dispara el hook de Render en cada push a `main`. Ahora mismo está deployando con 13 tests rotos.
- Acción: añadir un job previo que ejecute `npm test` (backend y frontend) + `tsc --noEmit` y bloquee el deploy si falla.

---

## P1 — Fiabilidad

### 5. GIFs hotlinkeados a `raw.githubusercontent.com` (1.324 ejercicios)
- GitHub raw no es un CDN: aplica throttling, no garantiza disponibilidad y el repo origen puede desaparecer o renombrarse → todos los GIFs se romperían de golpe.
- Acción: descargar los assets y servirlos desde storage propio (Vercel Blob, Cloudflare R2 o Cloudinary con transformación/compresión). Guardar en la BBDD la URL propia. Mientras tanto: `onError` en el `<img>` con fallback a `image_url` o placeholder.

### 6. Historial: last-write-wins entre dispositivos
- `PUT /api/history` reemplaza el documento entero. Si el usuario entrena desde dos dispositivos, el último en sincronizar pisa lo del otro (el merge existe en cliente — `mergeHistories()` — pero solo si hizo GET antes).
- Acción: merge en servidor por `id` de log, o endpoint append-only para nuevos workouts. Revisar también el tope `max(100)` del schema: definir qué pasa al superarlo (rotación de los más antiguos).

### 7. Favoritos sin validación
- `POST /api/favorites/:exerciseId` acepta cualquier string y lo añade al array sin comprobar que el ejercicio exista ni limitar el tamaño del array.
- Acción: validar `exerciseId` contra `ExerciseModel` (o formato con Zod) y capar favoritos (p. ej. 200).

### 8. Observabilidad y arranque en frío de Render
- `/health` no informa del estado de la BBDD (mongo vs fallback JSON) — añadirlo ayuda a diagnosticar el modo degradado.
- El plan free de Render duerme el servicio → primer request ~30 s. Ya existe modo offline en el frontend, pero conviene: ping de keep-alive (cron/UptimeRobot) o aviso "despertando servidor…" en la UI durante la generación.

### 9. Apagado limpio del servidor
- `server.ts` no maneja `SIGTERM`: en cada deploy de Render las requests en vuelo se cortan.
- Acción: `server.close()` + `mongoose.disconnect()` en `SIGTERM`/`SIGINT`.

---

## P2 — Seguridad

### 10. JWT de 30 días sin revocación
- El logout solo borra el token del cliente; un token filtrado vale 30 días. El timeout de inactividad (30 min) es solo client-side — el token sigue siendo válido.
- Acción: reducir TTL (p. ej. 7 días) y/o añadir `tokenVersion` en el documento de usuario que `requireAuth` compruebe, permitiendo invalidar sesiones. Refresh tokens si se quiere UX de sesión larga.

### 11. Rate limiting solo en `/api/auth`
- `/api/routines/generate` y `/api/history` no tienen límite: un script puede machacar la generación de rutinas o el upsert de historial.
- Acción: limiter general (p. ej. 100 req/15 min por IP) sobre `/api`, manteniendo el estricto en auth.

### 12. Endurecer credenciales
- Password mínimo 6 caracteres sin más política; verificar que el email se normaliza a lowercase antes de guardar/buscar (evita duplicados `Foo@x.com` / `foo@x.com`).
- Nota asumida: token en `localStorage` es vulnerable a XSS — riesgo aceptado por simplicidad; mitigar manteniendo dependencias al día y sin `dangerouslySetInnerHTML` (el `html` de SweetAlert es estático, OK).

---

## P3 — Calidad y deuda técnica

### 13. Inline styles → clases CSS (pendiente de Fase 1.5)
- `App.tsx`, `ClientArea.tsx` y otros componentes siguen llenos de `style={{...}}`. Es el único punto de la Fase 1.5 realmente sin hacer.

### 14. `contextburn.md` desactualizado
- Los checkboxes de Fase 1.5 (Zod en endpoints, `crypto.randomUUID()`, hooks extraídos, `ConfirmModal`, skeleton) figuran como pendientes pero **ya están implementados**. Marcarlos para que el documento vuelva a ser fiable.

### 15. Cobertura de tests desequilibrada
- Frontend: solo `lib/` (gamification, history, progress) tiene tests; cero tests de componentes/hooks (`useWorkout`, `useAuth` con su idle-timeout son buenos candidatos).
- Backend: controllers y middleware sin tests (p. ej. `requireAuth`, `HistoryController` con payload inválido).

### 16. Lint + typecheck en CI
- Añadir `oxlint` y `tsc --noEmit` al workflow (se integra con el punto 4).

---

## P4 — Operaciones pendientes (acción del usuario)

- [ ] Configurar `MONGO_URI` nuevo en Render (pendiente desde el reseteo).
- [ ] Enviar `sitemap.xml` en Google Search Console.
- [ ] Verificar dominios activos en producción (burnoutapp.es / burnout.minuesa.es) y limpiar del CORS el que ya no se use.

---

## Orden sugerido de ejecución

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Fix 13 tests backend | 1-2 h | Alto — recupera la red de seguridad |
| 2 | Límite 10kb historial | 15 min | Alto — bug de datos en producción |
| 3 | Commit cambios locales | 10 min | Alto — trabajo sin publicar |
| 4 | CI con tests antes de deploy | 30 min | Alto — evita regresiones futuras |
| 5 | Rate limit general + graceful shutdown | 30 min | Medio |
| 6 | Migrar GIFs a storage propio | 2-4 h | Medio — riesgo de rotura masiva |
| 7 | Merge servidor de historial | 2 h | Medio |
| 8 | Revocación JWT / TTL menor | 1-2 h | Medio |
| 9 | Inline styles → CSS | 2-3 h | Bajo — deuda visual |
| 10 | Tests de componentes/hooks | 3+ h | Bajo-medio |
