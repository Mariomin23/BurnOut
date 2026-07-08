import express from 'express';
import cors from 'cors';
import routineRoutes from './routes/routineRoutes';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';

const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Bind API routes
app.use('/api/routines', routineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
