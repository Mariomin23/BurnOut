# Fase 4 — Gamificación Avanzada y SEO/SEM (Design)

**Fecha:** 2026-07-08
**Origen:** `contextburn.md` §7 — medallas por volumen, logros por ejercicio dominado, niveles por experiencia acumulada; JSON-LD y URLs canónicas por ejercicio.

## A. Gamificación

1. **Todo derivado del historial** (`lib/gamification.ts`, puro y testeado): nada nuevo que persistir salvo la mejor racha, que se añade al storage existente de `useStreak` (`fit_poke_streak_v2.best`, retrocompatible).
2. **21 medallas en 4 grupos**: Volumen total (7: de 1.000 a 250.000 kg), Entrenamientos (6: de 1 a 100), Rachas (4: mejor racha de 3 a 30 días), Maestría (4: ejercicios dominados = 5+ sesiones registradas).
3. **Niveles por XP**: `XP = entrenos×100 + ⌊volumen/250⌋×25 + dominados×150 + mejorRacha×30`. Coste por nivel aritmético (400, 600, 800…), 11 títulos de Novato a Leyenda (tope).
4. **UI**: sección "Logros" al inicio de Historial y Progreso (tarjeta de nivel con barra de XP, grid de medallas con las bloqueadas atenuadas, chips de ejercicios dominados) + badge "⭐ Nv. X" en el header junto a la racha.

## B. SEO/SEM

1. **Fichas estáticas por ejercicio** sin migrar de framework: `scripts/generate-seo-pages.mjs` corre tras `vite build` y genera `dist/ejercicios/<slug>/index.html` para los 150 ejercicios + un índice `/ejercicios/`. HTML real y autocontenido (estilo dark inline), canónica, Open Graph y JSON-LD (`ExercisePlan` + `BreadcrumbList`). Vercel los sirve como estáticos (filesystem gana a la SPA).
2. **Slugs**: nombre normalizado sin acentos (`press-de-banca-con-barra`); colisiones → sufijo con id. exercises.json del backend sigue siendo la única fuente de verdad; si el build no puede leerlo, avisa y no rompe.
3. **sitemap.xml (152 URLs) + robots.txt** generados en el mismo paso.
4. **index.html**: meta description, canónica, Open Graph/Twitter, JSON-LD `WebApplication`. Título del documento dinámico por vista en la SPA.

## Fuera de alcance

- SSR/SSG del app shell (Next/Astro) — las fichas estáticas cubren la indexación sin migración.
- Logros sociales / compartir medallas.
- Google Search Console / alta del sitemap (acción del usuario).
