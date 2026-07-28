import { Router } from 'express';
import { RoutineController } from '../controllers/routineController';
import { RoutineService } from '../services/routineService';
import { HybridExerciseRepository } from '../repositories/hybridExerciseRepository';
import { requireAuth } from '../middleware/requireAuth';
import { requireDb } from '../middleware/requireDb';

const router = Router();

// Instantiate dependencies — Mongo si hay conexión, JSON como fallback
const exerciseRepo = new HybridExerciseRepository();
const routineService = new RoutineService(exerciseRepo);
const routineController = new RoutineController(routineService, exerciseRepo);

// Define routes
router.post('/generate', routineController.generate);
router.post('/reroll', routineController.reroll);
// Los favoritos viven en Mongo y son por usuario
router.post('/from-favorites', requireDb, requireAuth, routineController.generateFromFavorites);

export default router;
