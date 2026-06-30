import { useState, useCallback } from 'react';
import type { UserProfile, WorkoutRoutine, WorkoutExercise, RoutineSet } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/routines';
const ROUTINE_KEY = 'fit_poke_active_routine';
const PROFILE_KEY = 'fit_poke_profile';

function buildOfflineRoutine(userProfile: UserProfile): WorkoutRoutine {
  return {
    id: `fallback-${Math.random().toString(36).substring(2, 7)}`,
    split: userProfile.split,
    goal: userProfile.goal,
    warmup: ['5 min de movilidad articular general', 'Sentadillas dinámicas libres (15 reps)'],
    exercises: [
      {
        exercise: {
          id: 'ex-fb1',
          name: userProfile.split === 'Tren Inferior' ? 'Sentadillas Corporales Profundas' : 'Flexiones de Pecho',
          target_muscle: userProfile.split === 'Tren Inferior' ? 'Cuádriceps' : 'Pecho',
          split_category: userProfile.split === 'Tren Inferior' ? 'tren_inferior' : 'tren_superior',
          youtube_video_url: 'https://www.youtube.com/embed/yR3_92s8Zt4',
          difficulty: userProfile.experience,
          description: 'Ejercicio de autocarga de emergencia offline. Realízalo con técnica controlada.',
        },
        sets: Array.from({ length: 3 }, (_, i) => ({
          setIndex: i + 1,
          suggestedReps: userProfile.goal === 'Perder Peso' ? 15 : 12,
          suggestedWeightKg: 0,
        })),
        restTimerSeconds: 60,
      },
    ],
    cooldown: ['Estiramientos generales pasivos (1 min)'],
    createdAt: new Date().toISOString(),
    isCompleted: false,
  };
}

export interface WorkoutSummary {
  totalVolumeKg: number;
  completedSets: number;
  avgRpe: number;
}

export function useWorkout() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(() => {
    try {
      const raw = localStorage.getItem(ROUTINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [rerollingId, setRerollingId] = useState<string | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const persistRoutine = useCallback((routine: WorkoutRoutine | null) => {
    setActiveRoutine(routine);
    if (routine) {
      localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
    } else {
      localStorage.removeItem(ROUTINE_KEY);
    }
  }, []);

  const handleGenerateRoutine = useCallback(async (userProfile: UserProfile) => {
    setLoading(true);
    setWorkoutSummary(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });
      if (!response.ok) throw new Error('No se pudo generar la rutina');
      const routineData: WorkoutRoutine = await response.json();
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      persistRoutine(routineData);
    } catch {
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      persistRoutine(buildOfflineRoutine(userProfile));
    } finally {
      setLoading(false);
    }
  }, [persistRoutine]);

  const handleRerollExercise = useCallback(async (exerciseId: string, targetMuscle: string) => {
    if (!activeRoutine || !profile) return;
    setRerollingId(exerciseId);
    const excludedIds = activeRoutine.exercises.map(e => e.exercise.id);
    try {
      const response = await fetch(`${API_BASE_URL}/reroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMuscle, excludedIds, profile }),
      });
      if (!response.ok) throw new Error('Error al hacer re-roll');
      const newExercise: WorkoutExercise = await response.json();
      persistRoutine({
        ...activeRoutine,
        exercises: activeRoutine.exercises.map(item =>
          item.exercise.id === exerciseId ? newExercise : item
        ),
      });
    } catch {
      // Silent fail — el usuario se queda en el ejercicio actual
    } finally {
      setRerollingId(null);
    }
  }, [activeRoutine, profile, persistRoutine]);

  const handleUpdateSet = useCallback((exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => {
    if (!activeRoutine) return;
    persistRoutine({
      ...activeRoutine,
      exercises: activeRoutine.exercises.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        return {
          ...item,
          sets: item.sets.map(set =>
            set.setIndex === setIndex ? { ...set, ...updatedFields } : set
          ),
        };
      }),
    });
  }, [activeRoutine, persistRoutine]);

  const handleCompleteWorkout = useCallback((): WorkoutSummary => {
    if (!activeRoutine) return { totalVolumeKg: 0, completedSets: 0, avgRpe: 0 };
    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalRpeSum = 0;

    activeRoutine.exercises.forEach(item => {
      item.sets.forEach(set => {
        if (set.completedReps !== undefined) {
          totalVolume += (set.completedWeightKg ?? 0) * set.completedReps;
          completedSetsCount++;
          totalRpeSum += set.completedRpe ?? 8;
        }
      });
    });

    const summary: WorkoutSummary = {
      totalVolumeKg: totalVolume,
      completedSets: completedSetsCount,
      avgRpe: completedSetsCount > 0
        ? Number((totalRpeSum / completedSetsCount).toFixed(1))
        : 0,
    };
    setWorkoutSummary(summary);
    persistRoutine(null);
    return summary;
  }, [activeRoutine, persistRoutine]);

  const handleAbandonWorkout = useCallback(() => {
    persistRoutine(null);
    setWorkoutSummary(null);
    setShowAbandonModal(false);
  }, [persistRoutine]);

  const handleGoHome = useCallback(() => {
    setWorkoutSummary(null);
  }, []);

  return {
    profile,
    activeRoutine,
    loading,
    rerollingId,
    workoutSummary,
    showAbandonModal,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  };
}
