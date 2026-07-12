import React, { useState } from 'react';

interface AdminPanelProps {
  email: string;
  onBack: () => void;
}

type AdminTab = 'usuarios' | 'ejercicios' | 'estadisticas';

export const AdminPanel: React.FC<AdminPanelProps> = ({ email, onBack }) => {
  const [tab, setTab] = useState<AdminTab>('usuarios');

  return (
    <div className="fade-in">
      <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
              ⚙️ Panel de Administración
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{email}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>

        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0' }}>
          <div
            className={`pill-option ${tab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTab('usuarios')}
            style={{ fontSize: '0.75rem' }}
          >
            👥 Usuarios
          </div>
          <div
            className={`pill-option ${tab === 'ejercicios' ? 'active' : ''}`}
            onClick={() => setTab('ejercicios')}
            style={{ fontSize: '0.75rem' }}
          >
            🏋️ Ejercicios
          </div>
          <div
            className={`pill-option ${tab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => setTab('estadisticas')}
            style={{ fontSize: '0.75rem' }}
          >
            📊 Stats
          </div>
        </div>
      </div>

      <div className="glass fade-in" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚧</p>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Próximamente</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Esta sección se habilitará en próximas versiones de BurnOut.
        </p>
      </div>
    </div>
  );
};
