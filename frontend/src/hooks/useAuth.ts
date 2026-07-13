import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { API_ROOT } from '../lib/api';

const AUTH_KEY = 'fit_poke_auth_v1';
const ACTIVITY_KEY = 'fit_poke_last_activity';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

interface AuthState {
  token: string;
  email: string;
  role: 'user' | 'admin';
}

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.email !== 'string') return null;
    return { token: parsed.token, email: parsed.email, role: parsed.role === 'admin' ? 'admin' : 'user' };
  } catch {
    return null;
  }
}

function stampActivity() {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    setAuth(null);
    setAuthError(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  }, []);

  // Idle session timeout
  useEffect(() => {
    if (!auth) {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      return;
    }

    stampActivity();

    const events = ['click', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach(e => window.addEventListener(e, stampActivity, { passive: true }));

    idleTimerRef.current = setInterval(() => {
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) ?? '0', 10);
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        logout();
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Llevas 30 minutos sin actividad. Vuelve a iniciar sesión.',
          icon: 'info',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#7c3aed',
          background: '#1a1a2e',
          color: '#e2e8f0',
        });
      }
    }, 60_000);

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      events.forEach(e => window.removeEventListener(e, stampActivity));
    };
  }, [auth, logout]);

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
      const next: AuthState = {
        token: data.token,
        email: data.email,
        role: data.role === 'admin' ? 'admin' : 'user',
      };
      setAuth(next);
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      stampActivity();
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

  return {
    token: auth?.token ?? null,
    email: auth?.email ?? null,
    role: auth?.role ?? 'user',
    authLoading,
    authError,
    login,
    register,
    logout,
  };
}
