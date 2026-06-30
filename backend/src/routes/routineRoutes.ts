import { Router } from 'express';
import { RoutineController } from '../controllers/routineController';
import { RoutineService } from '../services/routineService';
import { JsonExerciseRepository } from '../repositories/exerciseRepository';

const router = Router();

// Instantiate dependencies
const exerciseRepo = new JsonExerciseRepository();
const routineService = new RoutineService(exerciseRepo);
const routineController = new RoutineController(routineService);

// Define routes
router.post('/generate', routineController.generate);
router.post('/reroll', routineController.reroll);

export default router;
