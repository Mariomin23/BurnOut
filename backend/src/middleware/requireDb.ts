import { Request, Response, NextFunction } from 'express';
import { isDbConnected } from '../db/connection';

/** Auth e historial necesitan MongoDB; sin conexión devolvemos 503 en vez de romper. */
export function requireDb(req: Request, res: Response, next: NextFunction): void {
  if (!isDbConnected()) {
    res.status(503).json({ error: 'Base de datos no disponible. Cuentas e historial en nube desactivados.' });
    return;
  }
  next();
}
