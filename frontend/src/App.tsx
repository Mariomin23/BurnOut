import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, WorkoutRoutine, WorkoutExercise, RoutineSet } from './types';
import { UserProfileForm } from './components/UserProfileForm';
import { ExerciseCard } from './components/ExerciseCard';
import { RestTimer } from './components/RestTimer';

const API_BASE_URL = 'http://localhost:5000/api/routines';

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [loading, setLoading] = useState(false);
  const [rerollingId, setRerollingId] = useState<string | null>(null);
  
  // Timer state
  const [restDuration, setRestDuration] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  // Gamification & Session
  const [streak, setStreak] = useState(0);
  const [workoutSummary, setWorkoutSummary] = useState<{
    totalVolumeKg: number;
    completedSets: number;
    avgRpe: number;
  } | null>(null);

  // 1. Initial hydration from LocalStorage
  useEffect(() => {
    const cachedProfile = localStorage.getItem('fit_poke_profile');
    const cachedRoutine = localStorage.getItem('fit_poke_active_routine');
    const cachedStreak = localStorage.getItem('fit_poke_streak');

    if (cachedProfile) {
      try { setProfile(JSON.parse(cachedProfile)); } catch(e) { console.error(e); }
    }
    if (cachedRoutine) {
      try { setActiveRoutine(JSON.parse(cachedRoutine)); } catch(e) { console.error(e); }
    }
    if (cachedStreak) {
      setStreak(Number(cachedStreak));
    }
  }, []);

  // 2. Persist active routine updates to LocalStorage
  const saveRoutineToCache = useCallback((routine: WorkoutRoutine | null) => {
    setActiveRoutine(routine);
    if (routine) {
      localStorage.setItem('fit_poke_active_routine', JSON.stringify(routine));
    } else {
      localStorage.removeItem('fit_poke_active_routine');
    }
  }, []);

  // 3. Generate new routine from API
  const handleGenerateRoutine = async (userProfile: UserProfile) => {
    setLoading(true);
    setWorkoutSummary(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar la rutina');
      }

      const routineData = await response.json();
      setProfile(userProfile);
      localStorage.setItem('fit_poke_profile', JSON.stringify(userProfile));
      saveRoutineToCache(routineData);
    } catch (error) {
      console.error('Error generating routine:', error);
      alert('Error de conexión con el servidor. Generando una rutina de emergencia fuera de línea...');
      // Off-line fallback routine generation
      generateOfflineRoutine(userProfile);
    } finally {
      setLoading(false);
    }
  };

  // Offline Fallback generator in case server is not running or unreachable
  const generateOfflineRoutine = (userProfile: UserProfile) => {
    const fallbackRoutine: WorkoutRoutine = {
      id: 'fallback-' + Math.random().toString(36).substring(2, 7),
      split: userProfile.split,
      goal: userProfile.goal,
      warmup: ["5 min de movilidad articular general", "Sentadillas dinámicas libres (15 reps)"],
      exercises: [
        {
          exercise: {
            id: 'ex-fb1',
            name: userProfile.split === 'Tren Inferior' ? 'Sentadillas Corporales Profundas' : 'Flexiones de Pecho',
            target_muscle: userProfile.split === 'Tren Inferior' ? 'Cuádriceps' : 'Pecho',
            split_category: userProfile.split === 'Tren Inferior' ? 'tren_inferior' : 'tren_superior',
            youtube_video_url: 'https://www.youtube.com/embed/yR3_92s8Zt4',
            difficulty: userProfile.experience,
            description: 'Ejercicio de autocarga de emergencia offline. Realízalo con técnica controlada.'
          },
          sets: Array.from({ length: 3 }, (_, i) => ({
            setIndex: i + 1,
            suggestedReps: userProfile.goal === 'Perder Peso' ? 15 : 12,
            suggestedWeightKg: 0
          })),
          restTimerSeconds: 60
        }
      ],
      cooldown: ["Estiramientos generales pasivos (1 min)"],
      createdAt: new Date().toISOString(),
      isCompleted: false
    };
    setProfile(userProfile);
    saveRoutineToCache(fallbackRoutine);
  };

  // 4. Update individual set (weight, reps, rpe)
  const handleUpdateSet = useCallback((exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => {
    if (!activeRoutine) return;

    const updatedExercises = activeRoutine.exercises.map((item) => {
      if (item.exercise.id !== exerciseId) return item;

      const updatedSets = item.sets.map((set) => {
        if (set.setIndex !== setIndex) return set;
        return { ...set, ...updatedFields };
      });

      return { ...item, sets: updatedSets };
    });

    const updatedRoutine = { ...activeRoutine, exercises: updatedExercises };
    saveRoutineToCache(updatedRoutine);
  }, [activeRoutine, saveRoutineToCache]);

  // 5. Re-roll an individual exercise from API
  const handleRerollExercise = async (exerciseId: string, targetMuscle: string) => {
    if (!activeRoutine || !profile) return;
    
    setRerollingId(exerciseId);
    
    const excludedIds = activeRoutine.exercises.map(e => e.exercise.id);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMuscle,
          excludedIds,
          profile
        }),
      });

      if (!response.ok) {
        throw new Error('Error al hacer re-roll del ejercicio');
      }

      const newWorkoutExercise: WorkoutExercise = await response.json();
      
      const updatedExercises = activeRoutine.exercises.map(item => {
        if (item.exercise.id === exerciseId) {
          return newWorkoutExercise;
        }
        return item;
      });

      const updatedRoutine = { ...activeRoutine, exercises: updatedExercises };
      saveRoutineToCache(updatedRoutine);
    } catch (error) {
      console.error('Reroll failed, executing offline reroll fallback:', error);
      alert('No se pudo conectar con la API. Prueba a reintentar.');
    } finally {
      setRerollingId(null);
    }
  };

  // 6. Rest Timer activation
  const handleStartRest = useCallback((seconds: number) => {
    setRestDuration(seconds);
    setTimerKey(prev => prev + 1);
  }, []);

  // 7. Complete workout calculation
  const handleCompleteWorkout = () => {
    if (!activeRoutine) return;

    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalRpeSum = 0;

    activeRoutine.exercises.forEach((item) => {
      item.sets.forEach((set) => {
        if (set.completedReps !== undefined) {
          const reps = set.completedReps;
          const weight = set.completedWeightKg ?? 0;
          const rpe = set.completedRpe ?? 8;
          
          totalVolume += weight * reps;
          completedSetsCount++;
          totalRpeSum += rpe;
        }
      });
    });

    const averageRpe = completedSetsCount > 0 ? Number((totalRpeSum / completedSetsCount).toFixed(1)) : 0;
    
    // Update streak (only increment if at least 1 set was finished)
    let newStreak = streak;
    if (completedSetsCount > 0) {
      newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('fit_poke_streak', String(newStreak));
    }

    setWorkoutSummary({
      totalVolumeKg: totalVolume,
      completedSets: completedSetsCount,
      avgRpe: averageRpe
    });

    // Clear active routine from cache
    saveRoutineToCache(null);
  };

  const handleAbandonWorkout = () => {
    if (window.confirm('¿Seguro que quieres abandonar el entrenamiento actual? Los datos no guardados se perderán.')) {
      saveRoutineToCache(null);
      setWorkoutSummary(null);
    }
  };

  const handleGoHome = () => {
    setWorkoutSummary(null);
  };

  // 8. Progress Calculation
  const progressRatio = useMemo(() => {
    if (!activeRoutine) return 0;
    let totalSets = 0;
    let completedSets = 0;

    activeRoutine.exercises.forEach(item => {
      item.sets.forEach(set => {
        totalSets++;
        if (set.completedReps !== undefined) completedSets++;
      });
    });

    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }, [activeRoutine]);

  return (
    <div className="container">
      {/* App Header */}
      <header className="app-header fade-in">
        <h1 className="logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          <span>☄️</span> Fit-PokéAPI
        </h1>
        {streak > 0 && (
          <div className="badge-pill" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            🔥 Racha: <strong>{streak}</strong>
          </div>
        )}
      </header>

      {/* 1. Loading Overlay */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }} className="fade-in">
          <div className="pulse-neon" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            ⚡
          </div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
            Calculando rutinas biomecánicas...
          </p>
        </div>
      )}

      {/* 2. Workout Completion Summary View */}
      {!loading && workoutSummary && (
        <div className="glass fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--color-primary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '0.5rem', fontSize: '1.6rem' }}>
            ¡Entrenamiento Completado!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Buen trabajo. Has sumado un entrenamiento más a tu rutina deportiva.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', margin: '1.5rem 0' }}>
            <div className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Volumen</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-secondary)' }}>{workoutSummary.totalVolumeKg} kg</div>
            </div>
            <div className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Series</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-primary)' }}>{workoutSummary.completedSets}</div>
            </div>
            <div className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>RPE Medio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-accent)' }}>{workoutSummary.avgRpe || 'N/A'}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '2rem' }}>
            <div style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <span>🔥</span> Racha Actual: {streak} días
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              ¡No rompas el ciclo! Vuelve mañana para seguir mejorando.
            </p>
          </div>

          <button onClick={handleGoHome} className="btn btn-primary" style={{ width: '100%' }}>
            Nuevo Entrenamiento ⚡
          </button>
        </div>
      )}

      {/* 3. Welcome / Profile Form Setup View */}
      {!loading && !activeRoutine && !workoutSummary && (
        <UserProfileForm onSubmit={handleGenerateRoutine} isLoading={loading} />
      )}

      {/* 4. Active Workout Dashboard View */}
      {!loading && activeRoutine && !workoutSummary && (
        <div className="fade-in">
          {/* Active stats bar */}
          <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <span className="badge-pill badge-split" style={{ marginRight: '0.5rem' }}>{activeRoutine.split}</span>
                <span className="badge-pill badge-goal">{activeRoutine.goal}</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                Progreso: {progressRatio}%
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressRatio}%`, background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>

          {/* Warmup Section */}
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', background: 'rgba(2, 132, 199, 0.05)', borderColor: 'rgba(2, 132, 199, 0.15)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-secondary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧘‍♂️</span> Calentamiento Específico
            </h3>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {activeRoutine.warmup.map((warm, idx) => (
                <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0.35rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-secondary)' }}>•</span>
                  <span>{warm}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exercises Feed */}
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '1rem' }}>
            Ejercicios del Día 🏋️
          </h2>
          {activeRoutine.exercises.map((item) => (
            <ExerciseCard
              key={item.exercise.id}
              item={item}
              onReroll={handleRerollExercise}
              onUpdateSet={handleUpdateSet}
              onStartRest={handleStartRest}
              isRerolling={rerollingId === item.exercise.id}
            />
          ))}

          {/* Cooldown Section */}
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>❄️</span> Vuelta a la Calma
            </h3>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {activeRoutine.cooldown.map((cool, idx) => (
                <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0.35rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary)' }}>•</span>
                  <span>{cool}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={handleAbandonWorkout} className="btn btn-danger">
              Abandonar
            </button>
            <button onClick={handleCompleteWorkout} className="btn btn-primary">
              Terminar Rutina ✨
            </button>
          </div>
        </div>
      )}

      {/* 5. Shared Rest Timer overlay */}
      {restDuration !== null && (
        <RestTimer
          key={timerKey}
          initialSeconds={restDuration}
          onClose={() => setRestDuration(null)}
        />
      )}
    </div>
  );
}

export default App;
