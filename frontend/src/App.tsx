import { useMemo } from 'react';
import { UserProfileForm } from './components/UserProfileForm';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseCardSkeleton } from './components/ExerciseCardSkeleton';
import { RestTimer } from './components/RestTimer';
import { ConfirmModal } from './components/ConfirmModal';
import { useWorkout } from './hooks/useWorkout';
import { useStreak } from './hooks/useStreak';
import { useRestTimer } from './hooks/useRestTimer';

function App() {
  const {
    activeRoutine,
    loading,
    rerollingId,
    workoutSummary,
    showAbandonModal,
    isOfflineMode,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  } = useWorkout();

  const { streak, recordWorkout } = useStreak();
  const { restDuration, timerKey, handleStartRest, handleCloseTimer } = useRestTimer();

  const onCompleteWorkout = () => {
    handleCompleteWorkout();
    recordWorkout();
  };

  const progressRatio = useMemo(() => {
    if (!activeRoutine) return 0;
    let total = 0;
    let completed = 0;
    activeRoutine.exercises.forEach(item => {
      item.sets.forEach(set => {
        total++;
        if (set.completed) completed++;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [activeRoutine]);

  return (
    <div className="container">
      <header className="app-header fade-in">
        <h1 className="logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          <span>☄️</span> BurnOut
        </h1>
        {streak > 0 && (
          <div className="badge-pill badge-streak">
            🔥 Racha: <strong>{streak}</strong>
          </div>
        )}
      </header>

      {/* Loading skeletons */}
      {loading && (
        <div className="loading-container fade-in">
          <ExerciseCardSkeleton />
          <ExerciseCardSkeleton />
          <ExerciseCardSkeleton />
        </div>
      )}

      {/* Workout summary */}
      {!loading && workoutSummary && (
        <div className="glass summary-card fade-in">
          <div className="summary-trophy">🏆</div>
          <h2 className="summary-title">¡Entrenamiento Completado!</h2>
          <p className="summary-subtitle">
            Buen trabajo. Has sumado un entrenamiento más a tu rutina deportiva.
          </p>
          <div className="summary-grid">
            <div className="glass summary-stat">
              <div className="summary-stat__label">Volumen</div>
              <div className="summary-stat__value summary-stat__value--secondary">
                {workoutSummary.totalVolumeKg} kg
              </div>
            </div>
            <div className="glass summary-stat">
              <div className="summary-stat__label">Series</div>
              <div className="summary-stat__value summary-stat__value--primary">
                {workoutSummary.completedSets}
              </div>
            </div>
            <div className="glass summary-stat">
              <div className="summary-stat__label">RPE Medio</div>
              <div className="summary-stat__value summary-stat__value--accent">
                {workoutSummary.avgRpe || 'N/A'}
              </div>
            </div>
          </div>
          <div className="summary-streak-box">
            <div className="summary-streak-count">
              <span>🔥</span> Racha Actual: {streak} días
            </div>
            <p className="summary-streak-hint">
              ¡No rompas el ciclo! Vuelve mañana para seguir mejorando.
            </p>
          </div>
          <button onClick={handleGoHome} className="btn btn-primary" style={{ width: '100%' }}>
            Nuevo Entrenamiento ⚡
          </button>
        </div>
      )}

      {/* Profile form */}
      {!loading && !activeRoutine && !workoutSummary && (
        <UserProfileForm onSubmit={handleGenerateRoutine} isLoading={loading} />
      )}

      {/* Active workout */}
      {!loading && activeRoutine && !workoutSummary && (
        <div className="fade-in">
          <div className="glass workout-stats-bar">
            <div className="workout-stats-bar__top">
              <div>
                <span className="badge-pill badge-split" style={{ marginRight: '0.5rem' }}>
                  {activeRoutine.split}
                </span>
                <span className="badge-pill badge-goal">{activeRoutine.goal}</span>
              </div>
              <div className="workout-stats-bar__progress-label">
                Progreso: {progressRatio}%
              </div>
            </div>
            <div className="workout-progress-track">
              <div
                className="workout-progress-fill"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>

          <div className="glass warmup-section">
            <h3 className="warmup-section__title">
              <span>🧘‍♂️</span> Calentamiento Específico
            </h3>
            <ul className="phase-list">
              {activeRoutine.warmup.map((item, idx) => (
                <li key={idx} className="phase-list__item">
                  <span className="phase-list__bullet phase-list__bullet--secondary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {isOfflineMode && (
            <div className="glass fade-in" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '3px solid var(--color-warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span>⚠️</span>
              <span>Modo offline — servidor no disponible. Rutina de ejercicios de peso corporal generada.</span>
            </div>
          )}

          <h2 className="exercises-heading">Ejercicios del Día 🏋️</h2>

          {activeRoutine.exercises.map(item => (
            <ExerciseCard
              key={item.exercise.id}
              item={item}
              onReroll={handleRerollExercise}
              onUpdateSet={handleUpdateSet}
              onStartRest={handleStartRest}
              isRerolling={rerollingId === item.exercise.id}
            />
          ))}

          <div className="glass cooldown-section">
            <h3 className="cooldown-section__title">
              <span>❄️</span> Vuelta a la Calma
            </h3>
            <ul className="phase-list">
              {activeRoutine.cooldown.map((item, idx) => (
                <li key={idx} className="phase-list__item">
                  <span className="phase-list__bullet phase-list__bullet--primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="workout-actions">
            <button onClick={() => setShowAbandonModal(true)} className="btn btn-danger">
              Abandonar
            </button>
            <button onClick={onCompleteWorkout} className="btn btn-primary">
              Terminar Rutina ✨
            </button>
          </div>
        </div>
      )}

      {showAbandonModal && (
        <ConfirmModal
          message="¿Seguro que quieres abandonar el entrenamiento actual? Los datos no guardados se perderán."
          confirmLabel="Abandonar"
          cancelLabel="Cancelar"
          onConfirm={handleAbandonWorkout}
          onCancel={() => setShowAbandonModal(false)}
        />
      )}

      {restDuration !== null && (
        <RestTimer
          key={timerKey}
          initialSeconds={restDuration}
          onClose={handleCloseTimer}
        />
      )}
    </div>
  );
}

export default App;
