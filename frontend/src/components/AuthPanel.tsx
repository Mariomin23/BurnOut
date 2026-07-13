import React, { useEffect, useRef, useState } from 'react';

interface AuthPanelProps {
  email: string | null;
  authLoading: boolean;
  authError: string | null;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  forceOpen?: boolean;
  onExpanded?: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  email,
  authLoading,
  authError,
  onLogin,
  onRegister,
  onLogout,
  forceOpen,
  onExpanded,
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceOpen && !email) {
      setExpanded(true);
      onExpanded?.();
    }
  }, [forceOpen, email, onExpanded]);

  useEffect(() => {
    if (expanded) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [expanded]);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  if (email) {
    return (
      <div className="glass auth-panel fade-in">
        <span className="auth-panel__status">
          ☁️ Sesión iniciada como <strong>{email}</strong> — historial sincronizado
        </span>
        <button className="btn btn-secondary auth-panel__small-btn" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button className="btn btn-secondary auth-panel__toggle-btn" onClick={() => setExpanded(true)}>
        ☁️ Guarda tu progreso en la nube — Inicia sesión
      </button>
    );
  }

  const submit = async (mode: 'login' | 'register') => {
    const ok = mode === 'login'
      ? await onLogin(formEmail.trim(), formPassword)
      : await onRegister(formEmail.trim(), formPassword);
    if (ok) {
      setExpanded(false);
      setFormPassword('');
    }
  };

  return (
    <div ref={panelRef} className="glass auth-panel auth-panel--form fade-in">
      <div className="auth-panel__header">
        <span className="auth-panel__title">☁️ Cuenta BurnOut</span>
        <button className="btn btn-secondary auth-panel__small-btn" onClick={() => setExpanded(false)}>
          ✕
        </button>
      </div>
      <form onSubmit={e => { e.preventDefault(); submit('login'); }}>
        <input
          type="email"
          className="form-input"
          placeholder="tu@email.com"
          value={formEmail}
          onChange={e => setFormEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          className="form-input"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={formPassword}
          onChange={e => setFormPassword(e.target.value)}
          autoComplete="current-password"
          minLength={6}
          required
        />
        {authError && <p className="auth-panel__error">{authError}</p>}
        <div className="auth-panel__actions">
          <button type="submit" className="btn btn-primary" disabled={authLoading}>
            {authLoading ? '...' : 'Entrar'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={authLoading}
            onClick={() => submit('register')}
          >
            Crear cuenta
          </button>
        </div>
      </form>
    </div>
  );
};
