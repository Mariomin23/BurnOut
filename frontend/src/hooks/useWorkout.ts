import { useState, useCallback } from 'react';
import type { UserProfile, WorkoutRoutine, WorkoutExercise, RoutineSet } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/routines';
const ROUTINE_KEY = 'fit_poke_active_routine';
const PROFILE_KEY = 'fit_poke_profile';

function buildOfflineRoutine(userProfile: UserProfile): WorkoutRoutine {
  const reps = userProfile.goal === 'Perder Peso' ? 15 : 12;
  const sets = (id: string, name: string, muscle: string, split_category: 'tren_superior' | 'tren_inferior' | 'ambos', description: string) => ({
    exercise: { id, name, target_muscle: muscle, split_category, difficulty: userProfile.experience, description },
    sets: Array.from({ length: 3 }, (_, i) => ({ setIndex: i + 1, suggestedReps: reps, suggestedWeightKg: 0 })),
    restTimerSeconds: 60,
  });

  let exercises;
  let warmup: string[];
  let cooldown: string[];

  if (userProfile.split === 'Tren Superior') {
    exercises = [
      sets('ex-fb-pecho1', 'Flexiones de Pecho', 'Pecho', 'tren_superior', 'Manos a la anchura de hombros, baja el pecho hasta casi tocar el suelo y empuja.'),
      sets('ex-fb-espalda1', 'Remo Invertido en Mesa', 'Espalda', 'tren_superior', 'Tumbado bajo una mesa, agarra el borde y tira del pecho hacia arriba retrayendo las escápulas.'),
      sets('ex-fb-pecho2', 'Flexiones Inclinadas (pies elevados)', 'Pecho', 'tren_superior', 'Pies en silla o sofá, manos en el suelo. Trabaja la porción superior del pecho.'),
      sets('ex-fb-hombros1', 'Pike Push-up (Flexión en Pica)', 'Hombros', 'tren_superior', 'Caderas elevadas, cuerpo en V invertida. Dobla los codos bajando la cabeza al suelo y empuja.'),
      sets('ex-fb-triceps1', 'Fondos entre Sillas', 'Tríceps', 'tren_superior', 'Manos en el borde de una silla detrás, piernas extendidas. Baja flexionando los codos y sube.'),
      sets('ex-fb-biceps1', 'Curl con Mochila o Bolsa', 'Bíceps', 'tren_superior', 'Agarra una mochila con peso con palmas hacia arriba y flexiona los codos controladamente.'),
    ];
    warmup = ['5 min de movilidad de hombros (rotaciones de brazos)', 'Aperturas dinámicas de pecho (20 reps sin peso)', 'Flexiones de rodillas lentas x 10 (activación)'];
    cooldown = ['Estiramiento de pectoral en marco de puerta (30s)', 'Estiramiento de tríceps detrás de la cabeza (30s por brazo)', 'Rotación interna/externa de hombros suave (15s por lado)'];
  } else if (userProfile.split === 'Tren Inferior') {
    exercises = [
      sets('ex-fb-cuad1', 'Sentadillas Corporales Profundas', 'Cuádriceps', 'tren_inferior', 'Pies a la anchura de hombros, desciende hasta los muslos paralelos al suelo o más abajo.'),
      sets('ex-fb-fem1', 'Peso Muerto a Una Pierna sin Carga', 'Femorales', 'tren_inferior', 'De pie en una pierna, inclina el torso hacia adelante con la espalda recta hasta sentir el estiramiento femoral.'),
      sets('ex-fb-cuad2', 'Zancadas Alternas en el Sitio', 'Cuádriceps', 'tren_inferior', 'Da un paso al frente y baja la rodilla trasera cerca del suelo. Alterna piernas.'),
      sets('ex-fb-fem2', 'Puente de Glúteos con Pausa', 'Femorales', 'tren_inferior', 'Tumbado boca arriba, pies apoyados. Eleva la cadera apretando glúteos y femorales. Aguanta 2s arriba.'),
      sets('ex-fb-glut1', 'Elevación de Cadera en el Suelo (Hip Thrust)', 'Glúteos', 'tren_inferior', 'Espalda en el suelo, rodillas dobladas. Empuja la cadera hacia arriba apretando los glúteos al máximo.'),
      sets('ex-fb-gem1', 'Elevación de Talones en Escalón', 'Gemelos', 'tren_inferior', 'De pie en el borde de un escalón, baja los talones y sube sobre las puntas completamente.'),
    ];
    warmup = ['5 min de marcha en el sitio con rodillas altas', 'Movilidad de cadera (rotaciones 90/90: 10 reps por lado)', 'Sentadillas corporales lentas x 15 (activación)'];
    cooldown = ['Estiramiento de cuádriceps de pie (30s por pierna)', 'Estiramiento de isquiotibiales sentado (30s)', 'Estiramiento de glúteos cruzando pierna sobre la otra (30s)'];
  } else {
    exercises = [
      sets('ex-fb-pecho1', 'Flexiones de Pecho', 'Pecho', 'tren_superior', 'Manos a la anchura de hombros, baja el pecho hasta casi tocar el suelo y empuja.'),
      sets('ex-fb-cuad1', 'Sentadillas Corporales Profundas', 'Cuádriceps', 'tren_inferior', 'Pies a la anchura de hombros, desciende hasta los muslos paralelos al suelo o más abajo.'),
      sets('ex-fb-espalda1', 'Remo Invertido en Mesa', 'Espalda', 'tren_superior', 'Tumbado bajo una mesa, agarra el borde y tira del pecho hacia arriba retrayendo las escápulas.'),
      sets('ex-fb-fem1', 'Peso Muerto a Una Pierna sin Carga', 'Femorales', 'tren_inferior', 'De pie en una pierna, inclina el torso hacia adelante con la espalda recta hasta sentir el estiramiento femoral.'),
      sets('ex-fb-core1', 'Plancha Abdominal', 'Core', 'ambos', 'Apóyate sobre antebrazos y puntas de pies. Cuerpo en línea recta, core contraído. Aguanta.'),
      sets('ex-fb-glut1', 'Elevación de Cadera en el Suelo (Hip Thrust)', 'Glúteos', 'tren_inferior', 'Espalda en el suelo, rodillas dobladas. Empuja la cadera hacia arriba apretando los glúteos al máximo.'),
    ];
    warmup = ['5 min de elíptica o trote suave en el sitio', 'Movilidad articular general (hombros, cadera, rodillas)', 'Sentadillas corporales + flexiones x 10 (activación)'];
    cooldown = ['Estiramiento general de cadena posterior (45s)', 'Postura del niño para relajar la espalda baja (1 min)', 'Estiramiento cruzado de hombros (30s por lado)'];
  }

  return {
    id: `fallback-${Math.random().toString(36).substring(2, 7)}`,
    split: userProfile.split,
    goal: userProfile.goal,
    warmup,
    exercises,
    cooldown,
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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
      setIsOfflineMode(true);
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
        if (set.completed) {
          totalVolume += (set.completedWeightKg ?? 0) * (set.completedReps ?? 0);
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
    setIsOfflineMode(false);
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
    isOfflineMode,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  };
}
