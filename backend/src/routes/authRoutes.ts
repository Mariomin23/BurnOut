import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireDb } from '../middleware/requireDb';

const router = Router();
const controller = new AuthController();

router.post('/register', requireDb, controller.register);
router.post('/login', requireDb, controller.login);

export default router;
