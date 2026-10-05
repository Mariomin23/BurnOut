import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_TTL = '7d';
const TOKEN_ALGORITHM = 'HS256';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  /** Versión de sesión del usuario al emitir el token (ver UserDoc.tokenVersion) */
  tokenVersion: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no definida — la autenticación no puede funcionar sin ella');
  }
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL, algorithm: TOKEN_ALGORITHM });
}

/** Devuelve el payload si el token es válido, o null si no lo es (nunca lanza). */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: [TOKEN_ALGORITHM] });
    if (typeof decoded !== 'object' || decoded === null) return null;
    const { userId, email, role, tokenVersion } = decoded as Record<string, unknown>;
    if (typeof userId !== 'string' || typeof email !== 'string') return null;
    return {
      userId,
      email,
      role: role === 'admin' ? 'admin' : 'user',
      // Tokens anteriores a este campo equivalen a la versión inicial
      tokenVersion: typeof tokenVersion === 'number' ? tokenVersion : 0,
    };
  } catch {
    return null;
  }
}
