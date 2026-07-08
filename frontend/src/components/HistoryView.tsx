import React, { useMemo, useState } from 'react';
import type { WorkoutLog } from '../types';
import type { GamificationState } from '../lib/gamification';
import { listTrackedExercises, buildProgressSeries, workoutMuscles } from '../lib/progress';
import { ProgressChart } from './ProgressChart';
import { AchievementsSection } from './AchievementsSection';

interface HistoryViewProps {
  history: WorkoutLog[];
  gamification: GamificationState;
  onBack: () => void;
}

const formatWorkoutDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const HistoryView: React.FC<HistoryViewProps> = ({ history, gamification, onBack }) => {
  const tracked = useMemo(() => listTrackedExercises(history), [history]);
  const [selectedId, setSelectedId] = useState<string>(() => tracked[0]?.exerciseId ?? '');

  const series = useMemo(
    () => (selectedId ? buildProgressSeries(history, selectedId) : []),
    [history, selectedId]
  );

  const totalVolumeKg = useMemo(
    () => Math.round(history.reduce((sum, w) => sum + w.totalVolumeKg, 0)),
    [history]
  );

  const recentFirst = useMemo(() => [...history].reverse(), [history]);

  return (
    <div className="fade-in">
      <button className="btn btn-secondary history-back-btn" onClick={onBack}>
        ← Volver
      </button>

      <div className="glass history-stats-bar">
        <div className="history-stat">
          <div className="history-stat__value history-stat__value--primary">{history.length}</div>
          <div className="history-stat__label">Entrenamientos</div>
        </div>
        <div className="history-stat">
          <div className="history-stat__value history-stat__value--secondary">{totalVolumeKg} kg</div>
          <div className="history-stat__label">Volumen acumulado</div>
        </div>
      </div>

      <AchievementsSection gamification={gamification} />

      {tracked.length > 0 && (
        <div className="glass history-section">
          <h3 className="history-section__title">
            <span>📈</span> Progreso por Ejercicio
          </h3>
          <select
            className="form-input"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            aria-label="Ejercicio a visualizar"
          >
            {tracked.map(t => (
              <option key={t.exerciseId} value={t.exerciseId}>
                {t.exerciseName} ({t.sessions} {t.sessions === 1 ? 'sesión' : 'sesiones'})
              </option>
            ))}
          </select>
          <ProgressChart series={series} />
        </div>
      )}

      <div className="glass history-section">
        <h3 className="history-section__title">
          <span>🗓️</span> Historial de Entrenamientos
        </h3>
        {recentFirst.map(log => (
          <div key={log.id} className="history-entry">
            <div className="history-entry__top">
              <span className="history-entry__date">{formatWorkoutDate(log.date)}</span>
              <span className="history-entry__volume">{Math.round(log.totalVolumeKg)} kg</span>
            </div>
            <div className="history-entry__badges">
              <span className="badge-pill badge-split" style={{ fontSize: '0.65rem' }}>{log.split}</span>
              <span className="badge-pill badge-goal" style={{ fontSize: '0.65rem' }}>{log.goal}</span>
              {workoutMuscles(log).map(muscle => (
                <span key={muscle} className="badge-pill history-entry__muscle" style={{ fontSize: '0.65rem' }}>
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
