import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { UserModel } from '../models/user.model';
import { isDbConnected } from '../db/connection';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Además de la firma y la caducidad, comprueba contra la base de datos que el
 * usuario sigue existiendo y que el token no ha sido revocado (tokenVersion).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  if (!isDbConnected()) {
    res.status(503).json({ error: 'Base de datos no disponible. Cuentas e historial en nube desactivados.' });
    return;
  }
  try {
    const user = await UserModel.findById(payload.userId).select('tokenVersion').lean();
    if (!user || (user.tokenVersion ?? 0) !== payload.tokenVersion) {
      res.status(401).json({ error: 'Sesión caducada. Vuelve a iniciar sesión.' });
      return;
    }
  } catch {
    // userId con formato inválido u otro fallo de lectura: el token no vale
    res.status(401).json({ error: 'Token inválido o caducado' });
    return;
  }
  req.userId = payload.userId;
  next();
}
