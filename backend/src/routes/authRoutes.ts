import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireDb } from '../middleware/requireDb';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const controller = new AuthController();

router.post('/register', requireDb, controller.register);
router.post('/login', requireDb, controller.login);
router.post('/logout-all', requireDb, requireAuth, controller.logoutAll);

export default router;
