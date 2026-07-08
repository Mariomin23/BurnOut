import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { requireAuth } from '../middleware/requireAuth';
import { requireDb } from '../middleware/requireDb';

const router = Router();
const controller = new HistoryController();

router.get('/', requireDb, requireAuth, controller.get);
router.put('/', requireDb, requireAuth, controller.put);

export default router;
