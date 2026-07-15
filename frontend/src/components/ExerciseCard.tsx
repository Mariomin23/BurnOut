import React, { useState } from 'react';
import type { WorkoutExercise, RoutineSet } from '../types';

interface ExerciseCardProps {
  item: WorkoutExercise;
  onReroll: (exerciseId: string, targetMuscle: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => void;
  onStartRest: (seconds: number) => void;
  isRerolling: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (exerciseId: string) => void;
  showFavoriteButton?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  item,
  onReroll,
  onUpdateSet,
  onStartRest,
  isRerolling,
  isFavorite = false,
  onToggleFavorite,
  showFavoriteButton = false,
}) => {
  const { exercise, sets, restTimerSeconds } = item;
  const [isExpanded, setIsExpanded] = useState(true);

  const openVideoSearch = () => {
    const query = encodeURIComponent(`${exercise.name} técnica ejercicio`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="glass fade-in" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div className="exercise-card__header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="exercise-card__info">
          <div className="exercise-card__badges">
            <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
              {exercise.target_muscle}
            </span>
            {exercise.equipment === 'none' && (
              <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }} title="No requiere material de gimnasio">
                Sin material
              </span>
            )}
            {item.progressionDirection && (
              <span
                className={`badge-pill progression-badge progression-badge--${item.progressionDirection}`}
                style={{ fontSize: '0.65rem' }}
                title={
                  item.progressionDirection === 'up' ? 'Progresión: sube el peso'
                  : item.progressionDirection === 'down' ? 'Descarga: baja el peso'
                  : 'Consolida: mismo peso, busca más reps'
                }
              >
                {item.progressionDirection === 'up' ? '↑ Progresa'
                  : item.progressionDirection === 'down' ? '↓ Descarga'
                  : '= Consolida'}
              </span>
            )}
          </div>
          <h3 className="exercise-card__name">{exercise.name}</h3>
        </div>

        {exercise.gif_url && (
          <img
            src={exercise.gif_url}
            loading="lazy"
            alt=""
            aria-hidden="true"
            className="exercise-card__gif"
          />
        )}

        <div className="exercise-card__actions" onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-secondary btn-circle"
            style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={openVideoSearch}
            title="Buscar vídeo técnico en YouTube"
            aria-label="Buscar vídeo técnico en YouTube"
          >
            {/* Logo oficial de YouTube — mantener la proporción 28.57:20 (guía de marca) */}
            <svg width="20" height="14" viewBox="0 0 28.57 20" role="img" aria-hidden="true">
              <path
                fill="#FF0000"
                d="M27.973 3.123A3.578 3.578 0 0 0 25.447.597C23.22 0 14.285 0 14.285 0S5.35 0 3.123.597A3.578 3.578 0 0 0 .597 3.123C0 5.35 0 10 0 10s0 4.65.597 6.877a3.578 3.578 0 0 0 2.526 2.526C5.35 20 14.285 20 14.285 20s8.935 0 11.162-.597a3.578 3.578 0 0 0 2.526-2.526C28.57 14.65 28.57 10 28.57 10s0-4.65-.597-6.877z"
              />
              <path fill="#fff" d="M11.428 14.285 18.856 10l-7.428-4.285z" />
            </svg>
          </button>
          {showFavoriteButton && (
            <button
              className="btn btn-secondary btn-circle"
              style={{ width: '32px', height: '32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onToggleFavorite?.(exercise.id)}
              title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
          )}
          <button
            className="btn btn-primary btn-circle"
            style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
            onClick={() => onReroll(exercise.id, exercise.target_muscle)}
            disabled={isRerolling}
            title="Cambiar ejercicio (Re-roll)"
          >
            {isRerolling ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="exercise-card__body">
          <p className="exercise-card__description">{exercise.description}</p>

          <div className="set-table-header">
            <div>Set</div>
            <div>Objetivo</div>
            <div style={{ textAlign: 'center' }}>Peso (kg)</div>
            <div style={{ textAlign: 'center' }}>Reps</div>
            <div style={{ textAlign: 'center' }}>RPE</div>
            <div style={{ textAlign: 'right' }}>Ok</div>
          </div>

          {sets.map(set => {
            const isCompleted = set.completed === true;
            return (
              <div
                key={set.setIndex}
                className={`set-row${isCompleted ? ' set-row--completed' : ''}`}
              >
                <div className={`set-row__index${isCompleted ? ' set-row__index--completed' : ' set-row__index--pending'}`}>
                  #{set.setIndex}
                </div>

                <div className="set-row__target">
                  {set.suggestedWeightKg === 0 && set.suggestedReps === 0
                    ? '—'
                    : set.suggestedWeightKg === 0
                    ? `Autocarga × ${set.suggestedReps}`
                    : `${set.suggestedWeightKg}kg × ${set.suggestedReps}`}
                </div>

                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="kg"
                  disabled={isCompleted}
                  value={set.completedWeightKg ?? ''}
                  className="set-input"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedWeightKg: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                />

                <input
                  type="number"
                  min="0"
                  placeholder="reps"
                  disabled={isCompleted}
                  value={set.completedReps ?? ''}
                  className="set-input"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedReps: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                />

                <select
                  disabled={isCompleted}
                  value={set.completedRpe ?? ''}
                  className="set-select"
                  onChange={e => onUpdateSet(exercise.id, set.setIndex, {
                    completedRpe: e.target.value !== '' ? Number(e.target.value) : undefined,
                  })}
                >
                  <option value="">RPE</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <div style={{ textAlign: 'right' }}>
                  <button
                    className={`set-complete-btn${isCompleted ? ' set-complete-btn--done' : ' set-complete-btn--pending'}`}
                    onClick={() => {
                      if (isCompleted) {
                        onUpdateSet(exercise.id, set.setIndex, { completed: false });
                      } else {
                        onUpdateSet(exercise.id, set.setIndex, {
                          completed: true,
                          completedWeightKg: set.completedWeightKg ?? set.suggestedWeightKg,
                          completedReps: set.completedReps ?? set.suggestedReps,
                          completedRpe: set.completedRpe ?? 8,
                        });
                        onStartRest(restTimerSeconds);
                      }
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
