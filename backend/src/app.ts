import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import favoritesRoutes from './routes/favoritesRoutes';

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
    callback(new Error('CORS: origen no permitido'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

app.use('/api/routines', routineRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoritesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
