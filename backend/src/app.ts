import express from 'express';
import cors from 'cors';
import routineRoutes from './routes/routineRoutes';

const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Bind API routes
app.use('/api/routines', routineRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
