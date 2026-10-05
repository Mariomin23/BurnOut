import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile, WorkoutRoutine, WorkoutExercise, RoutineSet } from '../types';
import { useHistory } from './useHistory';
import { ROUTINES_API_URL, authFetch } from '../lib/api';

const API_BASE_URL = ROUTINES_API_URL;
const ROUTINE_KEY = 'fit_poke_active_routine';
const PROFILE_KEY = 'fit_poke_profile';

function buildOfflineRoutine(userProfile: UserProfile): WorkoutRoutine {
  const reps = userProfile.goal === 'Perder Peso' ? 15 : 12;
  const sets = (id: string, name: string, muscle: string, split_category: 'tren_superior' | 'tren_inferior' | 'ambos', description: string) => ({
    exercise: { id, name, target_muscle: muscle, split_category, difficulty: userProfile.experience, description, equipment: 'none' as const },
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

export function useWorkout(token: string | null = null) {
  const { history, appendWorkout, buildSummary } = useHistory(token);

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

  // La rutina activa se refleja en localStorage tras cada cambio
  useEffect(() => {
    try {
      if (activeRoutine) {
        localStorage.setItem(ROUTINE_KEY, JSON.stringify(activeRoutine));
      } else {
        localStorage.removeItem(ROUTINE_KEY);
      }
    } catch {
      // quota / modo privado: la rutina vive solo en memoria esta sesión
    }
  }, [activeRoutine]);

  // Refs para que los handlers que reciben las tarjetas no cambien de identidad
  // en cada tecla (si cambian, React.memo de ExerciseCard no sirve de nada)
  const activeRoutineRef = useRef(activeRoutine);
  const profileRef = useRef(profile);
  useEffect(() => {
    activeRoutineRef.current = activeRoutine;
    profileRef.current = profile;
  }, [activeRoutine, profile]);

  const handleGenerateRoutine = useCallback(async (userProfile: UserProfile) => {
    setLoading(true);
    setWorkoutSummary(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userProfile, history: buildSummary() }),
      });
      if (!response.ok) throw new Error('No se pudo generar la rutina');
      const routineData: WorkoutRoutine = await response.json();
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      setActiveRoutine(routineData);
    } catch {
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      setActiveRoutine(buildOfflineRoutine(userProfile));
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  }, [buildSummary]);

  /**
   * Rutina construida con los favoritos guardados en la cuenta. Sin sesión o sin
   * el mínimo de favoritos el backend responde 400 y devolvemos el motivo para
   * enseñárselo al usuario (aquí no hay fallback offline: los favoritos viven en Mongo).
   */
  const handleGenerateFromFavorites = useCallback(async (
    userProfile: UserProfile
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!token) return { ok: false, error: 'Inicia sesión para usar tus favoritos' };
    setLoading(true);
    setWorkoutSummary(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/from-favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...userProfile, history: buildSummary() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data.error ?? 'No se pudo generar la rutina de favoritos' };
      }
      setProfile(userProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      setIsOfflineMode(false);
      setActiveRoutine(data as WorkoutRoutine);
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor' };
    } finally {
      setLoading(false);
    }
  }, [token, buildSummary]);

  const handleRerollExercise = useCallback(async (exerciseId: string, targetMuscle: string) => {
    const routine = activeRoutineRef.current;
    const profile = profileRef.current;
    if (!routine || !profile) return;
    setRerollingId(exerciseId);
    const excludedIds = routine.exercises.map(e => e.exercise.id);
    try {
      const response = await fetch(`${API_BASE_URL}/reroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMuscle, excludedIds, profile, history: buildSummary() }),
      });
      if (!response.ok) throw new Error('Error al hacer re-roll');
      const newExercise: WorkoutExercise = await response.json();
      // Sobre el estado más reciente: no pisa las series anotadas durante la petición
      setActiveRoutine(prev => prev && {
        ...prev,
        exercises: prev.exercises.map(item =>
          item.exercise.id === exerciseId ? newExercise : item
        ),
      });
    } catch {
      // Silent fail — el usuario se queda en el ejercicio actual
    } finally {
      setRerollingId(null);
    }
  }, [buildSummary]);

  const handleUpdateSet = useCallback((exerciseId: string, setIndex: number, updatedFields: Partial<RoutineSet>) => {
    setActiveRoutine(prev => prev && {
      ...prev,
      exercises: prev.exercises.map(item => {
        if (item.exercise.id !== exerciseId) return item;
        return {
          ...item,
          sets: item.sets.map(set =>
            set.setIndex === setIndex ? { ...set, ...updatedFields } : set
          ),
        };
      }),
    });
  }, []);

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
    appendWorkout(activeRoutine);
    setWorkoutSummary(summary);
    setActiveRoutine(null);
    return summary;
  }, [activeRoutine, appendWorkout]);

  const handleAbandonWorkout = useCallback(() => {
    setActiveRoutine(null);
    setWorkoutSummary(null);
    setShowAbandonModal(false);
    setIsOfflineMode(false);
  }, []);

  const handleGoHome = useCallback(() => {
    setWorkoutSummary(null);
  }, []);

  return {
    history,
    profile,
    activeRoutine,
    loading,
    rerollingId,
    workoutSummary,
    showAbandonModal,
    isOfflineMode,
    setShowAbandonModal,
    handleGenerateRoutine,
    handleGenerateFromFavorites,
    handleRerollExercise,
    handleUpdateSet,
    handleCompleteWorkout,
    handleAbandonWorkout,
    handleGoHome,
  };
}
