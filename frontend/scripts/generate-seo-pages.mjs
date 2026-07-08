// Post-build: genera fichas estáticas de ejercicios (/ejercicios/<slug>/),
// sitemap.xml y robots.txt en dist/. Los crawlers indexan HTML real con
// JSON-LD y canónicas; la SPA no cambia.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const SITE = process.env.VITE_SITE_URL ?? 'https://burnout.minuesa.es';
const EXERCISES_JSON = resolve(__dirname, '../../backend/src/data/exercises.json');

if (!existsSync(DIST)) {
  console.error('generate-seo-pages: dist/ no existe — ejecuta vite build primero');
  process.exit(1);
}

if (!existsSync(EXERCISES_JSON)) {
  // Build sin el directorio backend (p. ej. Vercel sin "include files outside root"):
  // no rompemos el build, solo avisamos.
  console.warn('generate-seo-pages: exercises.json no accesible — se omiten las fichas SEO');
  writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n`);
  process.exit(0);
}

const exercises = JSON.parse(readFileSync(EXERCISES_JSON, 'utf8'));

const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const DIFFICULTY_LABEL = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
const SPLIT_LABEL = { tren_superior: 'Tren Superior', tren_inferior: 'Tren Inferior', ambos: 'Cuerpo Completo' };
const EQUIPMENT_LABEL = { gym: 'Material de gimnasio', none: 'Sin material' };

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BASE_STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0b0d11; color: #e5e9f0; font-family: system-ui, -apple-system, sans-serif;
         line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 2rem 1.25rem; }
  a { color: #34d399; }
  header a { text-decoration: none; font-weight: 700; font-size: 1.1rem; color: #e5e9f0; }
  h1 { font-size: 1.6rem; margin: 1.2rem 0 0.6rem; }
  .badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .badge { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.6rem;
           border-radius: 999px; border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; background: rgba(56,189,248,0.1); }
  .desc { color: #b5bdca; margin-bottom: 1.5rem; }
  .cta { display: inline-block; background: #10b981; color: #06281d; font-weight: 700; padding: 0.8rem 1.4rem;
         border-radius: 12px; text-decoration: none; margin-top: 0.5rem; }
  footer { margin-top: 2.5rem; font-size: 0.8rem; color: #5d6577; }
  ul.exercise-list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
  ul.exercise-list a { display: block; padding: 0.7rem 1rem; border: 1px solid rgba(255,255,255,0.1);
                       border-radius: 10px; text-decoration: none; color: #e5e9f0; }
  ul.exercise-list a:hover { border-color: #34d399; }
  ul.exercise-list small { color: #5d6577; }
`;

const page = ({ title, description, canonical, jsonLd, body }) => `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="theme-color" content="#0b0d11" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/pwa-512.png" />
<meta property="og:locale" content="es_ES" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${BASE_STYLE}</style>
</head>
<body>
<header><a href="/">☄️ BurnOut</a></header>
${body}
<footer>BurnOut — Generador inteligente de rutinas de gimnasio. <a href="/">Genera tu rutina gratis</a>.</footer>
</body>
</html>
`;

// Slugs únicos (colisión → sufijo con id)
const used = new Set();
const withSlugs = exercises.map((ex) => {
  let slug = slugify(ex.name);
  if (used.has(slug)) slug = `${slug}-${ex.id}`;
  used.add(slug);
  return { ...ex, slug };
});

let count = 0;
for (const ex of withSlugs) {
  const url = `${SITE}/ejercicios/${ex.slug}/`;
  const title = `${ex.name} — Técnica y Músculos Trabajados | BurnOut`;
  const full = `${ex.name} (${ex.target_muscle}, nivel ${DIFFICULTY_LABEL[ex.difficulty]}): ${ex.description}`;
  const description = full.length <= 158 ? full : full.slice(0, 155).replace(/\s+\S*$/, '') + '…';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ExercisePlan',
        name: ex.name,
        description: ex.description,
        exerciseType: SPLIT_LABEL[ex.split_category],
        activityDuration: 'PT5M',
        intensity: DIFFICULTY_LABEL[ex.difficulty],
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Músculo objetivo', value: ex.target_muscle },
          { '@type': 'PropertyValue', name: 'Material', value: EQUIPMENT_LABEL[ex.equipment] },
        ],
        url,
        inLanguage: 'es',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BurnOut', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Ejercicios', item: `${SITE}/ejercicios/` },
          { '@type': 'ListItem', position: 3, name: ex.name, item: url },
        ],
      },
    ],
  };

  const body = `
<h1>${escapeHtml(ex.name)}</h1>
<div class="badges">
  <span class="badge">${escapeHtml(ex.target_muscle)}</span>
  <span class="badge">${SPLIT_LABEL[ex.split_category]}</span>
  <span class="badge">${DIFFICULTY_LABEL[ex.difficulty]}</span>
  <span class="badge">${EQUIPMENT_LABEL[ex.equipment]}</span>
</div>
<p class="desc">${escapeHtml(ex.description)}</p>
<p>Este ejercicio forma parte de la biblioteca de BurnOut: más de 150 ejercicios clasificados por grupo muscular,
dificultad y material necesario. El generador lo combina automáticamente en rutinas de ${SPLIT_LABEL[ex.split_category].toLowerCase()}
con pesos sugeridos según tu perfil y progresión automática sesión a sesión.</p>
<a class="cta" href="/">Generar una rutina con este ejercicio ⚡</a>
`;

  const dir = resolve(DIST, 'ejercicios', ex.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), page({ title, description, canonical: url, jsonLd, body }));
  count++;
}

// Índice de ejercicios
const indexBody = `
<h1>Biblioteca de Ejercicios (${withSlugs.length})</h1>
<p class="desc">Todos los ejercicios del generador de rutinas BurnOut, con técnica, músculo objetivo, dificultad y material necesario.</p>
<ul class="exercise-list">
${withSlugs
  .map(
    (ex) =>
      `<li><a href="/ejercicios/${ex.slug}/">${escapeHtml(ex.name)} <small>— ${escapeHtml(ex.target_muscle)} · ${DIFFICULTY_LABEL[ex.difficulty]}</small></a></li>`
  )
  .join('\n')}
</ul>
`;
writeFileSync(
  resolve(DIST, 'ejercicios', 'index.html'),
  page({
    title: 'Biblioteca de Ejercicios de Gimnasio | BurnOut',
    description: `Más de ${withSlugs.length} ejercicios de gimnasio y calistenia con técnica explicada, músculo objetivo, dificultad y material necesario.`,
    canonical: `${SITE}/ejercicios/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Biblioteca de Ejercicios BurnOut',
      url: `${SITE}/ejercicios/`,
      inLanguage: 'es',
    },
    body: indexBody,
  })
);

// sitemap.xml + robots.txt
const today = new Date().toISOString().split('T')[0];
const urls = [`${SITE}/`, `${SITE}/ejercicios/`, ...withSlugs.map((ex) => `${SITE}/ejercicios/${ex.slug}/`)];
writeFileSync(
  resolve(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`SEO: ${count} fichas de ejercicio + índice + sitemap (${urls.length} URLs) + robots.txt`);
