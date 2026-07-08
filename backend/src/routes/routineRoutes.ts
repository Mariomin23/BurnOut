import { Router } from 'express';
import { RoutineController } from '../controllers/routineController';
import { RoutineService } from '../services/routineService';
import { HybridExerciseRepository } from '../repositories/hybridExerciseRepository';

const router = Router();

// Instantiate dependencies — Mongo si hay conexión, JSON como fallback
const exerciseRepo = new HybridExerciseRepository();
const routineService = new RoutineService(exerciseRepo);
const routineController = new RoutineController(routineService);

// Define routes
router.post('/generate', routineController.generate);
router.post('/reroll', routineController.reroll);

export default router;
