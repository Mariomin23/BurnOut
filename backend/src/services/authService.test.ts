import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword, signToken, verifyToken } from './authService';

beforeAll(() => {
  process.env.JWT_SECRET = 'secreto-de-test-suficientemente-largo';
});

describe('authService — passwords', () => {
  it('hashea y verifica una contraseña correcta', async () => {
    const hash = await hashPassword('miPassword123');
    expect(hash).not.toBe('miPassword123');
    expect(await verifyPassword('miPassword123', hash)).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashPassword('miPassword123');
    expect(await verifyPassword('otraPassword', hash)).toBe(false);
  });
});

describe('authService — JWT', () => {
  it('firma y verifica un token con el payload íntegro', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com', role: 'user', tokenVersion: 3 });
    const payload = verifyToken(token);
    expect(payload).toEqual({ userId: 'abc123', email: 'test@test.com', role: 'user', tokenVersion: 3 });
  });

  it('devuelve null para un token manipulado', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com', role: 'user', tokenVersion: 3 });
    expect(verifyToken(token.slice(0, -2) + 'xx')).toBeNull();
    expect(verifyToken('no-es-un-token')).toBeNull();
  });

  it('devuelve null para un token firmado con otro secreto', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com', role: 'user', tokenVersion: 3 });
    process.env.JWT_SECRET = 'otro-secreto-distinto';
    expect(verifyToken(token)).toBeNull();
    process.env.JWT_SECRET = 'secreto-de-test-suficientemente-largo';
  });

  it('un token antiguo sin tokenVersion equivale a la versión 0', () => {
    const legacy = jwt.sign({ userId: 'abc123', email: 'test@test.com', role: 'user' }, process.env.JWT_SECRET!);
    expect(verifyToken(legacy)?.tokenVersion).toBe(0);
  });

  it('rechaza tokens firmados con otro algoritmo', () => {
    const other = jwt.sign({ userId: 'abc123', email: 'test@test.com' }, process.env.JWT_SECRET!, { algorithm: 'HS512' });
    expect(verifyToken(other)).toBeNull();
  });

  it('el token caduca a los 7 días', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com', role: 'user', tokenVersion: 0 });
    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
    expect(exp - iat).toBe(7 * 24 * 60 * 60);
  });
});
