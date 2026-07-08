import { describe, it, expect, beforeAll } from 'vitest';
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
    const token = signToken({ userId: 'abc123', email: 'test@test.com' });
    const payload = verifyToken(token);
    expect(payload).toEqual(expect.objectContaining({ userId: 'abc123', email: 'test@test.com' }));
  });

  it('devuelve null para un token manipulado', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com' });
    expect(verifyToken(token.slice(0, -2) + 'xx')).toBeNull();
    expect(verifyToken('no-es-un-token')).toBeNull();
  });

  it('devuelve null para un token firmado con otro secreto', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com' });
    process.env.JWT_SECRET = 'otro-secreto-distinto';
    expect(verifyToken(token)).toBeNull();
    process.env.JWT_SECRET = 'secreto-de-test-suficientemente-largo';
  });
});
