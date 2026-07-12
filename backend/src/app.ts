import express from 'express';
import cors from 'cors';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import favoritesRoutes from './routes/favoritesRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/routines', routineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoritesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
