import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }
  const payload = verifyToken(header.slice('Bearer '.length));
  if (!payload) {
    res.status(401).json({ error: 'Token inválido o caducado' });
    return;
  }
  req.userId = payload.userId;
  next();
}
