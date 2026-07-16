# Guía de Escalado — De proyecto personal a producto profesional

> Complementa `PLAN-MEJORAS-2026-07-16.md` (bugs y deuda técnica). Esta guía cubre lo que le falta a BurnOut para operar como un producto 100% profesional, ordenado en 4 niveles de madurez. Cada nivel asume el anterior completado.

---

## Nivel 1 — Estabilidad (el producto no se rompe)

*Prerequisito: los P0 del plan de mejoras (tests rotos, límite 10kb, CI sin tests).*

### 1.1 Pipeline CI/CD completo
- **Ahora:** push a `main` → deploy directo a producción sin tests ni build check.
- **Profesional:** PR obligatorio con branch protection en `main`; CI que ejecuta lint + `tsc` + tests de backend y frontend + build antes de mergear; deploy solo tras CI verde.
- Herramientas: GitHub Actions (ya tienes el workflow base), branch protection rules en el repo.

### 1.2 Entorno de staging
- **Ahora:** todo cambio va directo a producción real con usuarios reales.
- **Profesional:** entorno intermedio (Render segundo servicio + Vercel preview + BBDD Atlas separada) donde probar antes de promocionar. Vercel ya te da previews del frontend gratis; falta el equivalente backend + datos.

### 1.3 Backups y recuperación
- **Ahora:** Atlas free tier sin backups automáticos; si se corrompe la BBDD, se pierden usuarios e historiales.
- **Profesional:** backups automáticos diarios (Atlas M2+ los incluye, o `mongodump` programado con GitHub Actions → artefacto cifrado), y un procedimiento de restauración *probado* al menos una vez.

### 1.4 Cold starts de Render
- **Ahora:** free tier duerme → primer usuario del día espera ~30 s (el modo offline lo disimula, pero degrada la experiencia).
- **Profesional:** plan de pago de Render (~7 $/mes elimina el sleep) o migrar el backend a la misma plataforma que el frontend. Es el euro mejor gastado de toda esta guía.

---

## Nivel 2 — Confianza (sabes qué pasa y los usuarios pueden confiar en ti)

### 2.1 Observabilidad
- **Errores:** Sentry (free tier) en frontend y backend — hoy un error en producción solo se descubre si un usuario lo reporta.
- **Logs:** sustituir `console.error` por logger estructurado (pino) con niveles; Render los agrega pero sin estructura no se pueden filtrar.
- **Uptime:** UptimeRobot o similar contra `/health` con alerta a tu email (además mantiene Render despierto — dos pájaros).
- **Métricas mínimas:** latencia p95 de `/api/routines/generate`, tasa de errores 5xx, usuarios registrados/activos.

### 2.2 Ciclo de vida de cuenta completo — **la mayor laguna funcional actual**
Hoy una cuenta solo puede crearse y loguearse. Falta:
- **Recuperación de contraseña** (email con token de un solo uso — necesitas proveedor de email: Resend/Brevo free tier).
- **Verificación de email** al registrarse (evita cuentas basura y habilita comunicación).
- **Borrado de cuenta** desde el área cliente (además es obligación legal, ver 2.3).
- **Cambio de contraseña/email** logueado.

### 2.3 Legal — obligatorio con usuarios reales europeos
Guardas emails y contraseñas de usuarios: eso es tratamiento de datos personales bajo RGPD. Falta:
- **Política de privacidad** (qué guardas, dónde — Atlas/Render/Vercel son subencargados en EE. UU./UE —, cuánto tiempo, derechos del usuario).
- **Términos de uso** (el disclaimer de SweetAlert es un buen inicio pero no sustituye unos términos enlazables).
- **Derecho de supresión y portabilidad:** borrado de cuenta (2.2) y export de datos (un botón "descargar mis datos" en JSON basta).
- **Aviso legal** con identidad del responsable si hay cualquier monetización.

### 2.4 Seguridad de nivel producto
- Revocación de JWT y TTL menor (ya en plan P2).
- Cabecera CSP en el frontend (Vercel `vercel.json`/headers), no solo helmet en la API.
- `npm audit` + Dependabot activado en el repo (gratis, un click).
- Escaneo de secretos en CI (gitleaks) — ya tuviste una URI de Atlas pegada en chat; automatiza la red de seguridad.

---

## Nivel 3 — Producto (experiencia al nivel de una app comercial)

### 3.1 API profesional
- **Versionado:** prefijo `/api/v1/` antes de tener más consumidores — cambiarlo después rompe clientes.
- **Documentación:** OpenAPI/Swagger generado de los schemas Zod (`zod-openapi`) — casi gratis porque los schemas ya existen.
- **Paginación** en historial y favoritos antes de que crezcan.
- **Contrato de errores uniforme:** `{ error, code }` consistente en todos los endpoints (hoy cada controller improvisa el mensaje).

### 3.2 Datos y migraciones
- **Migraciones de esquema** (migrate-mongo): hoy los cambios de modelo dependen de que el seed lo arregle; con usuarios reales necesitas migraciones versionadas y reversibles.
- **Assets propios:** GIFs a storage/CDN propio (plan P1.5) con compresión — 1.324 GIFs pesan; WebP animado o vídeo MP4 corto reduce 60-80%.

### 3.3 Experiencia de usuario
- **Onboarding:** primer uso guiado (hoy el formulario asume que sabes qué es un split o RPE).
- **Accesibilidad WCAG AA:** auditoría con Lighthouse/axe — navegación por teclado, contraste, `aria-*` en modales y timer (el spec de sub-agentes ya lo menciona, sin ejecutar).
- **Analytics respetuoso:** Plausible/Umami (sin cookies, sin banner) para saber qué features se usan de verdad antes de construir más.
- **i18n:** todo el texto está hardcodeado en español; si algún día quieres inglés, extraer strings ahora es 10 veces más barato que después.

### 3.4 Testing de nivel producto
- **E2E automatizado** (Playwright, ya lo usaste en Fase 2A) del flujo crítico: registro → generar rutina → completar → ver historial. En CI contra staging.
- **Tests de componentes** de los hooks con lógica (useWorkout, useAuth con idle-timeout).
- **Cobertura como métrica de CI** (no como objetivo absoluto — como detector de regresiones de cobertura).

---

## Nivel 4 — Crecimiento (escalar usuarios y quizá ingresos)

### 4.1 Escalado técnico
- El stack actual (Render + Atlas + Vercel) aguanta miles de usuarios sin cambios — el cuello real será el free tier de Atlas (512 MB). Con historiales de ~50 KB/usuario, hay margen para ~5.000-8.000 usuarios activos antes de necesitar M2/M5.
- Cache de la biblioteca de ejercicios en memoria del proceso (ya es semi-estática) — evita el 90% de lecturas a Mongo.
- Si el tráfico crece: réplicas del servicio en Render y rate limiting compartido (Redis/Upstash) en vez del limiter en memoria actual.

### 4.2 Distribución
- **PWA ya instalada** — el escalón siguiente es publicar en stores con Capacitor (mismo código, wrapper nativo) si quieres presencia en Google Play/App Store.
- **SEO:** ya tienes 150 fichas estáticas + sitemap; falta darlas de alta en Search Console (pendiente) y medir qué posicionan. Contenido programático (rutinas de ejemplo por objetivo) es la palanca barata de tráfico orgánico.

### 4.3 Monetización (si se quiere)
- Modelo natural: free (rutinas + historial) / premium (progresión avanzada, export, estadísticas profundas). Stripe Checkout + un campo `plan` en el usuario — la arquitectura actual lo soporta sin rediseño.
- Antes de monetizar: todo el Nivel 2 es obligatorio (legal + recuperación de cuenta + observabilidad).

---

## Resumen — los 10 huecos que separan BurnOut de "profesional"

| # | Hueco | Nivel | Coste aprox. |
|---|-------|-------|--------------|
| 1 | CI que bloquea deploys rotos + branch protection | 1 | 1 h |
| 2 | Backups de BBDD probados | 1 | 2 h |
| 3 | Render sin cold starts | 1 | 7 $/mes |
| 4 | Sentry + uptime + logs estructurados | 2 | 3-4 h |
| 5 | Recuperación de contraseña + verificación email | 2 | 1-2 días |
| 6 | RGPD: privacidad, borrado de cuenta, export datos | 2 | 1-2 días |
| 7 | Staging con BBDD separada | 1-2 | 3-4 h |
| 8 | API versionada + errores uniformes + OpenAPI | 3 | 1 día |
| 9 | E2E del flujo crítico en CI | 3 | 1 día |
| 10 | Assets propios en CDN | 3 | medio día |

**Orden recomendado:** 1 → 3 → 2 → 4 → 5+6 (juntos, comparten el proveedor de email y tocan el área cliente) → 7 → resto según tracción. Con 1-6 hechos, BurnOut opera al nivel de un SaaS pequeño serio; 7-10 son para cuando haya usuarios que lo justifiquen.
