import { Request, Response } from 'express';
import { HistoryModel } from '../models/history.model';
import { HistoryPutSchema } from '../schemas/auth.schema';

export class HistoryController {
  public get = async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await HistoryModel.findOne({ userId: req.userId }).lean();
      res.json({ logs: doc?.logs ?? [] });
    } catch (error) {
      console.error('Error leyendo historial:', error);
      res.status(500).json({ error: 'Error interno al leer el historial' });
    }
  };

  public put = async (req: Request, res: Response): Promise<void> => {
    const result = HistoryPutSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Historial inválido' });
      return;
    }
    try {
      await HistoryModel.updateOne(
        { userId: req.userId },
        { $set: { logs: result.data.logs, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ saved: result.data.logs.length });
    } catch (error) {
      console.error('Error guardando historial:', error);
      res.status(500).json({ error: 'Error interno al guardar el historial' });
    }
  };
}
