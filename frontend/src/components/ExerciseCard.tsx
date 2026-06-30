import React, { useState } from 'react';
import type { WorkoutExercise, RoutineSet } from '../types';

interface ExerciseCardProps {
  item: WorkoutExercise;
  onReroll: (exerciseId: string, targetMuscle: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => void;
  onStartRest: (seconds: number) => void;
  isRerolling: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  item,
  onReroll,
  onUpdateSet,
  onStartRest,
  isRerolling,
}) => {
  const { exercise, sets, restTimerSeconds } = item;
  const [showVideo, setShowVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass fade-in" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      {/* Header Info */}
      <div 
        style={{ 
          padding: '1.25rem', 
          background: 'rgba(255,255,255,0.02)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ flex: 1, paddingRight: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>
              {exercise.target_muscle}
            </span>
            <span 
              className="badge-pill" 
              style={{ 
                fontSize: '0.65rem', 
                backgroundColor: exercise.difficulty === 'advanced' ? 'rgba(239, 68, 68, 0.15)' : exercise.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: exercise.difficulty === 'advanced' ? 'var(--color-danger)' : exercise.difficulty === 'intermediate' ? 'var(--color-accent)' : 'var(--color-primary)',
                border: `1px solid ${exercise.difficulty === 'advanced' ? 'rgba(239, 68, 68, 0.3)' : exercise.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}
            >
              {exercise.difficulty === 'advanced' ? 'Avanzado' : exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Principiante'}
            </span>
          </div>
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            {exercise.name}
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-secondary btn-circle" 
            style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
            onClick={() => setShowVideo(!showVideo)}
            title="Ver vídeo técnico"
          >
            📺
          </button>
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
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {exercise.description}
          </p>

          {/* YouTube Video Section */}
          {showVideo && (
            <div className="video-wrapper fade-in">
              <iframe 
                src={exercise.youtube_video_url} 
                title={exercise.name} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}

          {/* Table Headers */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 1fr 75px 65px 60px 40px', 
            gap: '6px', 
            fontSize: '0.7rem', 
            fontWeight: '600', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '0.5rem'
          }}>
            <div>Set</div>
            <div>Objetivo</div>
            <div style={{ textAlign: 'center' }}>Peso (kg)</div>
            <div style={{ textAlign: 'center' }}>Reps</div>
            <div style={{ textAlign: 'center' }}>RPE</div>
            <div style={{ textAlign: 'right' }}>Ok</div>
          </div>

          {/* Sets List */}
          {sets.map((set) => {
            const isCompleted = set.completedReps !== undefined;
            return (
              <div 
                key={set.setIndex} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 1fr 75px 65px 60px 40px', 
                  gap: '6px', 
                  alignItems: 'center', 
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              >
                {/* Index */}
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isCompleted ? 'var(--color-primary)' : 'white' }}>
                  #{set.setIndex}
                </div>

                {/* Target */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {set.suggestedWeightKg > 0 ? `${set.suggestedWeightKg}kg` : 'Autocarga'} x {set.suggestedReps}
                </div>

                {/* Weight Input */}
                <div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="kg"
                    disabled={isCompleted}
                    value={set.completedWeightKg ?? ''}
                    onChange={(e) => onUpdateSet(exercise.id, set.setIndex, { 
                      completedWeightKg: e.target.value !== '' ? Number(e.target.value) : undefined 
                    })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.25rem',
                      color: 'white',
                      fontSize: '0.85rem',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Reps Input */}
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="reps"
                    disabled={isCompleted}
                    value={set.completedReps ?? ''}
                    onChange={(e) => onUpdateSet(exercise.id, set.setIndex, { 
                      completedReps: e.target.value !== '' ? Number(e.target.value) : undefined 
                    })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.25rem',
                      color: 'white',
                      fontSize: '0.85rem',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* RPE Selector */}
                <div>
                  <select
                    disabled={isCompleted}
                    value={set.completedRpe ?? ''}
                    onChange={(e) => onUpdateSet(exercise.id, set.setIndex, { 
                      completedRpe: e.target.value !== '' ? Number(e.target.value) : undefined 
                    })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.15rem',
                      color: 'white',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      appearance: 'none'
                    }}
                  >
                    <option value="">RPE</option>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Completion Checkmark */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      if (isCompleted) {
                        // Mark as uncompleted
                        onUpdateSet(exercise.id, set.setIndex, { 
                          completedReps: undefined, 
                          completedWeightKg: undefined, 
                          completedRpe: undefined 
                        });
                      } else {
                        // Complete using values or fallbacks
                        const valWeight = set.completedWeightKg ?? set.suggestedWeightKg;
                        const valReps = set.completedReps ?? set.suggestedReps;
                        const valRpe = set.completedRpe ?? 8; // Default RPE 8 if not entered
                        
                        onUpdateSet(exercise.id, set.setIndex, {
                          completedWeightKg: valWeight,
                          completedReps: valReps,
                          completedRpe: valRpe
                        });

                        // Trigger rest timer
                        onStartRest(restTimerSeconds);
                      }
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: isCompleted ? 'none' : '1px solid var(--border-color)',
                      background: isCompleted ? 'var(--color-primary)' : 'transparent',
                      color: isCompleted ? 'var(--text-dark)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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
