import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ProfileController } from '../controllers/profileController';
import { requireAuth } from '../middleware/requireAuth';
import { requireDb } from '../middleware/requireDb';

const router = Router();
const controller = new ProfileController();

/** Subir foto es caro (600 KB de body): se limita aparte de las lecturas del perfil */
const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas subidas de foto. Espera 15 minutos.' },
});

router.use(requireDb, requireAuth);
router.get('/me', controller.me);
router.put('/avatar', avatarLimiter, controller.updateAvatar);
router.delete('/avatar', controller.deleteAvatar);

export default router;
