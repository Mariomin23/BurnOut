import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import favoritesRoutes from './routes/favoritesRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import profileRoutes from './routes/profileRoutes';
import { isDbConnected } from './db/connection';

const app = express();

// Render pone la app detrás de un proxy: necesario para que req.ip
// sea la IP real del cliente y el rate-limit no comparta cubo global
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // allow vercel preview deployments
    if (/^https:\/\/[a-z0-9-]+-marios-projects-[a-z0-9]+\.vercel\.app$/.test(origin)) return callback(null, true);
    if (origin === 'https://burnout.minuesa.es' || origin === 'https://www.burnout.minuesa.es') return callback(null, true);
    if (origin === 'https://burnoutapp.es' || origin === 'https://www.burnoutapp.es') return callback(null, true);
    // Sin cabeceras CORS el navegador bloquea la respuesta; no hace falta un 500
    callback(null, false);
  },
  // La sesión viaja en la cabecera Authorization, no en cookies: sin credentials
  // un origen de preview ajeno no puede hacer nada en nombre del usuario
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

// Tope general por IP: la generación de rutinas y el resto de la API no deben
// poder machacarse con un script. Holgado para un uso normal (incluso wifi compartida).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera unos minutos.' },
});

// El buscador es público y cada llamada es una regex sin índice contra Mongo
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas búsquedas. Espera unos minutos.' },
});

app.use('/api', apiLimiter);

// Cada grupo de rutas lleva el cupo de body que necesita y va antes del parser
// global, porque body-parser no vuelve a parsear un body ya leído.
// - perfil: la foto en base64
// - historial: PUT con el historial completo (hasta 100 entrenos)
// - rutinas: generate/reroll envían el resumen de historial
app.use('/api/profile', express.json({ limit: '600kb' }), profileRoutes);
app.use('/api/history', express.json({ limit: '200kb' }), historyRoutes);
app.use('/api/routines', express.json({ limit: '50kb' }), routineRoutes);

app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/exercises', searchLimiter, exerciseRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: isDbConnected() ? 'mongo' : 'json',
    timestamp: new Date().toISOString(),
  });
});

// Errores de body-parser y cualquier otro no capturado: siempre JSON, nunca
// la página HTML por defecto de Express
app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'La petición es demasiado grande' });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
