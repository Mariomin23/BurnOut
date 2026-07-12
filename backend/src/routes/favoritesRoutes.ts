import { Router } from 'express';
import { FavoritesController } from '../controllers/favoritesController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const ctrl = new FavoritesController();

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/:exerciseId', ctrl.add);
router.delete('/:exerciseId', ctrl.remove);

export default router;
