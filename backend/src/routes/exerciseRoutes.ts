import { Router } from 'express';
import { ExercisesController } from '../controllers/exercisesController';
import { HybridExerciseRepository } from '../repositories/hybridExerciseRepository';

const router = Router();
const controller = new ExercisesController(new HybridExerciseRepository());

router.get('/search', controller.search);

export default router;
