import React, { useMemo, useState } from 'react';
import type { WorkoutLog, Exercise } from '../types';
import type { GamificationState } from '../lib/gamification';
import { HistoryView } from './HistoryView';

interface ClientAreaProps {
  email: string;
  history: WorkoutLog[];
  gamification: GamificationState;
  favoriteExercises: Exercise[];
  onBack: () => void;
}

type ClientTab = 'historial' | 'favoritos';

export const ClientArea: React.FC<ClientAreaProps> = ({
  email,
  history,
  gamification,
  favoriteExercises,
  onBack,
}) => {
  const [tab, setTab] = useState<ClientTab>('historial');

  const lastSessionByExercise = useMemo(() => {
    const map = new Map<string, { date: string; sets: { weightKg: number; reps: number; rpe: number }[] }>();
    for (const workout of [...history].reverse()) {
      for (const ex of workout.exercises) {
        if (!map.has(ex.exerciseId)) {
          map.set(ex.exerciseId, { date: workout.date, sets: ex.sets });
        }
      }
    }
    return map;
  }, [history]);

  return (
    <div className="fade-in">
      <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
              Área Cliente
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{email}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>

        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '0' }}>
          <div
            className={`pill-option ${tab === 'historial' ? 'active' : ''}`}
            onClick={() => setTab('historial')}
            style={{ fontSize: '0.85rem' }}
          >
            📈 Mi Historial
          </div>
          <div
            className={`pill-option ${tab === 'favoritos' ? 'active' : ''}`}
            onClick={() => setTab('favoritos')}
            style={{ fontSize: '0.85rem' }}
          >
            ⭐ Mis Favoritos
          </div>
        </div>
      </div>

      {tab === 'historial' && (
        <HistoryView history={history} gamification={gamification} onBack={onBack} />
      )}

      {tab === 'favoritos' && (
        <div>
          {favoriteExercises.length === 0 ? (
            <div className="glass fade-in" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☆</p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Aún no tienes favoritos. Pulsa ⭐ en cualquier ejercicio durante el entrenamiento.
              </p>
            </div>
          ) : (
            favoriteExercises.map(ex => {
              const last = lastSessionByExercise.get(ex.id);
              return (
                <div
                  key={ex.id}
                  className="glass fade-in"
                  style={{ borderRadius: 'var(--radius-lg)', marginBottom: '1rem', overflow: 'hidden' }}
                >
                  <div style={{ padding: '1rem 1.25rem 0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>
                          ⭐ {ex.name}
                        </div>
                        <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
                          {ex.target_muscle}
                        </span>
                        {ex.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                            {ex.description}
                          </p>
                        )}
                      </div>
                      {ex.gif_url && (
                        <img
                          src={ex.gif_url}
                          loading="lazy"
                          alt=""
                          aria-hidden="true"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '0 1.25rem 1rem' }}>
                  {last ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                        Última sesión: {new Date(last.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {last.sets.map((s, i) => (
                          <div
                            key={i}
                            className="glass"
                            style={{ padding: '0.4rem 0.7rem', borderRadius: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}
                          >
                            <div style={{ fontWeight: 600 }}>Serie {i + 1}</div>
                            <div>{s.weightKg > 0 ? `${s.weightKg} kg` : 'Autocarga'} × {s.reps} reps</div>
                            {s.rpe > 0 && <div style={{ color: 'var(--color-text-muted)' }}>RPE {s.rpe}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                      Sin datos de sesiones anteriores
                    </p>
                  )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
