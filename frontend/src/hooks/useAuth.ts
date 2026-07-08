import { useCallback, useState } from 'react';
import { API_ROOT } from '../lib/api';

const AUTH_KEY = 'fit_poke_auth_v1';

interface AuthState {
  token: string;
  email: string;
}

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.token === 'string' && typeof parsed.email === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = useCallback(async (mode: 'login' | 'register', email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_ROOT}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.error ?? 'Error de autenticación');
        return false;
      }
      const next: AuthState = { token: data.token, email: data.email };
      setAuth(next);
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return true;
    } catch {
      setAuthError('No se pudo conectar con el servidor');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string) => authenticate('login', email, password), [authenticate]);
  const register = useCallback((email: string, password: string) => authenticate('register', email, password), [authenticate]);

  const logout = useCallback(() => {
    setAuth(null);
    setAuthError(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return {
    token: auth?.token ?? null,
    email: auth?.email ?? null,
    authLoading,
    authError,
    login,
    register,
    logout,
  };
}
