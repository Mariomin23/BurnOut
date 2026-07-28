import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import favoritesRoutes from './routes/favoritesRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import profileRoutes from './routes/profileRoutes';

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
    callback(new Error('CORS: origen no permitido'));
  },
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

// El perfil lleva la foto en base64: necesita más cupo que el resto de la API.
// Va antes del parser global porque body-parser no vuelve a parsear un body ya leído.
app.use('/api/profile', express.json({ limit: '600kb' }), profileRoutes);

app.use(express.json({ limit: '10kb' }));

app.use('/api/routines', routineRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/exercises', exerciseRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
