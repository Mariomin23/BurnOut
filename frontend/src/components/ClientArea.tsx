import React, { useMemo, useState } from 'react';
import type { WorkoutLog, Exercise } from '../types';
import type { GamificationState } from '../lib/gamification';
import { HistoryView } from './HistoryView';
import { ExerciseSearch } from './ExerciseSearch';
import { AvatarUploader } from './AvatarUploader';
import { MIN_FAVORITES_FOR_ROUTINE } from './UserProfileForm';

interface ClientAreaProps {
  email: string;
  history: WorkoutLog[];
  gamification: GamificationState;
  favoriteExercises: Exercise[];
  favoriteIds: Set<string>;
  onBack: () => void;
  onToggleFavorite?: (exerciseId: string) => void;
  /** Genera la rutina con los favoritos guardados; devuelve el motivo si falla */
  onGenerateFromFavorites?: () => void;
  avatarUrl: string | null;
  avatarLoading: boolean;
  avatarError: string | null;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
  onLogoutEverywhere: () => void;
}

type ClientTab = 'historial' | 'favoritos' | 'perfil';

export const ClientArea: React.FC<ClientAreaProps> = ({
  email,
  history,
  gamification,
  favoriteExercises,
  favoriteIds,
  onBack,
  onToggleFavorite,
  onGenerateFromFavorites,
  avatarUrl,
  avatarLoading,
  avatarError,
  onUploadAvatar,
  onRemoveAvatar,
  onLogoutEverywhere,
}) => {
  const [tab, setTab] = useState<ClientTab>('historial');
  const enoughFavorites = favoriteExercises.length >= MIN_FAVORITES_FOR_ROUTINE;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Tu foto de perfil" className="avatar" />
            ) : (
              <div className="avatar avatar--empty" aria-hidden="true">{email.charAt(0).toUpperCase()}</div>
            )}
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>
                Área Cliente
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{email}</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>

        <div className="pill-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0' }}>
          <div
            className={`pill-option ${tab === 'historial' ? 'active' : ''}`}
            onClick={() => setTab('historial')}
            style={{ fontSize: '0.8rem' }}
          >
            📈 Historial
          </div>
          <div
            className={`pill-option ${tab === 'favoritos' ? 'active' : ''}`}
            onClick={() => setTab('favoritos')}
            style={{ fontSize: '0.8rem' }}
          >
            ⭐ Favoritos
          </div>
          <div
            className={`pill-option ${tab === 'perfil' ? 'active' : ''}`}
            onClick={() => setTab('perfil')}
            style={{ fontSize: '0.8rem' }}
          >
            👤 Perfil
          </div>
        </div>
      </div>

      {tab === 'perfil' && (
        <div className="glass fade-in" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: '1rem' }}>
            Foto de perfil
          </h3>
          <AvatarUploader
            email={email}
            avatarUrl={avatarUrl}
            loading={avatarLoading}
            error={avatarError}
            onUpload={onUploadAvatar}
            onRemove={onRemoveAvatar}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
            La imagen se recorta a un cuadrado de 256 px antes de subirse. PNG, JPG o WebP.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '1.75rem 0 0.5rem' }}>
            Seguridad
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Si has perdido un dispositivo o iniciaste sesión en uno que no es tuyo, cierra la sesión
            en todos a la vez. Tendrás que volver a entrar también en este.
          </p>
          <button className="btn btn-danger" onClick={onLogoutEverywhere} style={{ fontSize: '0.85rem' }}>
            Cerrar sesión en todos los dispositivos
          </button>
        </div>
      )}

      {tab === 'historial' && (
        <HistoryView history={history} gamification={gamification} onBack={onBack} />
      )}

      {tab === 'favoritos' && (
        <div>
          <div className="glass fade-in" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
            {onToggleFavorite && (
              <ExerciseSearch favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} />
            )}

            {onGenerateFromFavorites && (
              <>
                <button
                  className="btn btn-primary favorites-routine-btn"
                  onClick={onGenerateFromFavorites}
                  disabled={!enoughFavorites}
                >
                  ⚡ Crear rutina con mis favoritos ({favoriteExercises.length})
                </button>
                {!enoughFavorites && (
                  <p className="favorites-routine-hint">
                    Necesitas {MIN_FAVORITES_FOR_ROUTINE} favoritos como mínimo; te faltan{' '}
                    {MIN_FAVORITES_FOR_ROUTINE - favoriteExercises.length}.
                  </p>
                )}
              </>
            )}
          </div>

          {favoriteExercises.length === 0 ? (
            <div className="glass fade-in" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☆</p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Aún no tienes favoritos. Búscalos aquí arriba o pulsa ⭐ en cualquier ejercicio
                durante el entrenamiento.
              </p>
            </div>
          ) : (
            favoriteExercises.map(ex => {
              const last = lastSessionByExercise.get(ex.id);
              const openVideo = () => {
                const q = encodeURIComponent(`${ex.name} técnica ejercicio`);
                window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank', 'noopener,noreferrer');
              };
              return (
                <div key={ex.id} className="glass fade-in" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <div className="exercise-card__header">
                    <div className="exercise-card__info">
                      <div className="exercise-card__badges">
                        <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
                          {ex.target_muscle}
                        </span>
                        {ex.equipment === 'none' && (
                          <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>Sin material</span>
                        )}
                      </div>
                      <h3 className="exercise-card__name">{ex.name}</h3>
                    </div>

                    {ex.gif_url && (
                      <img
                        src={ex.gif_url}
                        loading="lazy"
                        decoding="async"
                        crossOrigin="anonymous"
                        alt=""
                        aria-hidden="true"
                        className="exercise-card__gif"
                      />
                    )}

                    <div className="exercise-card__actions">
                      <button
                        className="btn btn-secondary btn-circle"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={openVideo}
                        title="Buscar vídeo técnico en YouTube"
                        aria-label="Buscar vídeo técnico en YouTube"
                      >
                        <svg width="20" height="14" viewBox="0 0 28.57 20" role="img" aria-hidden="true">
                          <path fill="#FF0000" d="M27.973 3.123A3.578 3.578 0 0 0 25.447.597C23.22 0 14.285 0 14.285 0S5.35 0 3.123.597A3.578 3.578 0 0 0 .597 3.123C0 5.35 0 10 0 10s0 4.65.597 6.877a3.578 3.578 0 0 0 2.526 2.526C5.35 20 14.285 20 14.285 20s8.935 0 11.162-.597a3.578 3.578 0 0 0 2.526-2.526C28.57 14.65 28.57 10 28.57 10s0-4.65-.597-6.877z" />
                          <path fill="#fff" d="M11.428 14.285 18.856 10l-7.428-4.285z" />
                        </svg>
                      </button>
                      {onToggleFavorite && (
                        <button
                          className="btn btn-secondary btn-circle"
                          style={{ width: '32px', height: '32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => onToggleFavorite(ex.id)}
                          title="Quitar de favoritos"
                          aria-label="Quitar de favoritos"
                        >
                          ⭐
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="exercise-card__body">
                    {ex.description && (
                      <p className="exercise-card__description">{ex.description}</p>
                    )}
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
