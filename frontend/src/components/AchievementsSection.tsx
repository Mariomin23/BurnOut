import React from 'react';
import type { GamificationState } from '../lib/gamification';

interface AchievementsSectionProps {
  gamification: GamificationState;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ gamification }) => {
  const { level, levelTitle, xp, xpIntoLevel, xpForNextLevel, medalGroups, earnedCount, totalMedals, masteredExercises } = gamification;
  const progressPct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  return (
    <div className="glass history-section">
      <h3 className="history-section__title">
        <span>🏅</span> Logros <span className="achievements-count">{earnedCount}/{totalMedals}</span>
      </h3>

      <div className="level-card">
        <div className="level-card__badge">⭐ {level}</div>
        <div className="level-card__info">
          <div className="level-card__top">
            <span className="level-card__title">{levelTitle}</span>
            <span className="level-card__xp">{xp.toLocaleString('es-ES')} XP</span>
          </div>
          <div className="workout-progress-track">
            <div className="workout-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="level-card__next">
            {xpIntoLevel.toLocaleString('es-ES')} / {xpForNextLevel.toLocaleString('es-ES')} XP para nivel {level + 1}
          </div>
        </div>
      </div>

      {medalGroups.map(group => (
        <div key={group.id} className="medal-group">
          <h4 className="medal-group__title">{group.title}</h4>
          <div className="medal-grid">
            {group.medals.map(medal => (
              <div
                key={medal.id}
                className={`medal${medal.earned ? ' medal--earned' : ''}`}
                title={medal.description}
              >
                <span className="medal__emoji">{medal.earned ? medal.emoji : '🔒'}</span>
                <span className="medal__title">{medal.title}</span>
                <span className="medal__desc">{medal.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {masteredExercises.length > 0 && (
        <div className="medal-group">
          <h4 className="medal-group__title">Ejercicios Dominados</h4>
          <div className="mastered-list">
            {masteredExercises.map(ex => (
              <span key={ex.exerciseId} className="badge-pill mastered-chip" title={`${ex.sessions} sesiones`}>
                🎓 {ex.exerciseName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
