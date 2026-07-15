import { randomUUID } from 'crypto';
import { IExerciseRepository } from '../repositories/exerciseRepository';
import {
  Exercise,
  WorkoutRoutine,
  WorkoutExercise,
  RoutineSet,
  UserProfile,
  ExerciseHistorySummary,
} from '../types';
import { ProgressionService } from './progressionService';

export class RoutineService {
  private progressionService = new ProgressionService();

  constructor(
    private exerciseRepository: IExerciseRepository,
    private rng: () => number = Math.random
  ) {}

  public async generateRoutine(
    profile: UserProfile,
    history: ExerciseHistorySummary[] = []
  ): Promise<WorkoutRoutine> {
    const rawExercises = await this.exerciseRepository.getAll();
    const allExercises = this.filterByEquipment(rawExercises, profile.equipment);
    const split = profile.split;
    const goal = profile.goal;
    const historyIds = new Set(history.map(h => h.exerciseId));
    const historyMap = new Map(history.map(h => [h.exerciseId, h.lastSession]));

    let selectedExercises: Exercise[] = [];

    if (split === 'Tren Superior') {
      const upperExs = allExercises.filter(e => e.split_category === 'tren_superior');
      const pecho = this.shuffle(upperExs.filter(e => e.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(e => e.target_muscle === 'Espalda'));
      const hombros = this.shuffle(upperExs.filter(e => e.target_muscle === 'Hombros'));
      const biceps = this.shuffle(upperExs.filter(e => e.target_muscle === 'Bíceps'));
      const triceps = this.shuffle(upperExs.filter(e => e.target_muscle === 'Tríceps'));

      // 2 Pecho, 2 Espalda, 1 Hombro, 1 Brazo (bíceps/tríceps al azar)
      const slots = [pecho, espalda, pecho, espalda, hombros, this.rng() > 0.5 ? biceps : triceps];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }
    } else if (split === 'Tren Inferior') {
      const lowerExs = allExercises.filter(e => e.split_category === 'tren_inferior');
      const cuadriceps = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Femorales'));
      const gluteos = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Glúteos'));
      const gemelos = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Gemelos'));

      // 2 Cuádriceps, 2 Femorales, 1 Glúteo, 1 Gemelos
      const slots = [cuadriceps, femorales, cuadriceps, femorales, gluteos, gemelos];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }
    } else {
      // Full Body
      const upperExs = allExercises.filter(e => e.split_category === 'tren_superior');
      const lowerExs = allExercises.filter(e => e.split_category === 'tren_inferior');
      const ambosExs = allExercises.filter(e => e.split_category === 'ambos');

      const pecho = this.shuffle(upperExs.filter(e => e.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(e => e.target_muscle === 'Espalda'));
      const cuadriceps = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(e => e.target_muscle === 'Femorales'));
      const core = this.shuffle(ambosExs.filter(e => e.target_muscle === 'Core'));

      // 1 Pecho, 1 Cuádriceps, 1 Espalda, 1 Femorales, 1 Core, 1 compuesto extra
      const slots = [pecho, cuadriceps, espalda, femorales, core];
      for (const pool of slots) {
        const pick = this.takeWithBias(pool, historyIds);
        if (pick) selectedExercises.push(pick);
      }

      const extraPool = this.shuffle(ambosExs.filter(
        e => e.target_muscle !== 'Core' && !selectedExercises.some(s => s.id === e.id)
      ));
      const extraCompound = this.takeWithBias(extraPool, historyIds);
      if (extraCompound) selectedExercises.push(extraCompound);
    }

    selectedExercises = selectedExercises.filter(Boolean).slice(0, 6);

    // 2. Determine sets, reps, rest timers, and weights suggestions
    const numSets = goal === 'Volumen' ? 4 : 3;
    const restTimerSeconds = goal === 'Perder Peso' ? 60 : goal === 'Volumen' ? 120 : 90;

    const exercisesWithSets: WorkoutExercise[] = selectedExercises.map(exercise => {
      const prescription = this.progressionService.prescribe(
        exercise,
        goal,
        historyMap.get(exercise.id)
      );
      const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
        setIndex: i + 1,
        suggestedReps: prescription.suggestedReps,
        suggestedWeightKg: prescription.suggestedWeightKg,
      }));

      return {
        exercise,
        sets,
        restTimerSeconds,
        ...(prescription.direction ? { progressionDirection: prescription.direction } : {}),
      };
    });

    // 3. Inject warm-up and cool-down
    let warmup: string[] = [];
    let cooldown: string[] = [];

    const noEquipment = profile.equipment === 'none';

    if (split === 'Tren Superior') {
      warmup = noEquipment
        ? [
            "5 min de trote suave o marcha en el sitio para entrar en calor",
            "Círculos amplios de brazos hacia adelante y atrás (15 reps por sentido)",
            "Rotaciones de hombro sin peso (2 series x 12 reps por sentido)",
            "Aperturas dinámicas de pecho en el sitio (sin peso, activación muscular)"
          ]
        : [
        "5 min de cardio ligero (elíptica/remo) para entrar en calor",
        "Movilidad articular de hombros con banda elástica (dislocaciones: 15 reps)",
        "Rotadores de hombro con polea o mancuerna ligera (2 series x 12 reps)",
        "Aperturas dinámicas de pecho en el sitio (sin peso, activación muscular)"
      ];
      cooldown = [
        "Estiramiento de pectoral abriendo brazos contra el marco de una puerta (30s)",
        "Estiramiento de dorsal ancho sujetándote de un poste e inclinándote (30s)",
        "Estiramiento pasivo de tríceps llevando el codo tras la cabeza (30s por brazo)"
      ];
    } else if (split === 'Tren Inferior') {
      warmup = [
        noEquipment
          ? "5 min de marcha en el sitio con rodillas altas"
          : "5 min de caminata en cinta con pendiente",
        "Movilidad de cadera dinámica (rotaciones 90/90 sentado: 10 reps por lado)",
        "Sentadillas profundas sin carga (peso corporal: 15 reps lentas)",
        "Zancadas dinámicas en el sitio sin peso (activación rodilla/glúteo)"
      ];
      cooldown = [
        "Estiramiento estático de cuádriceps de pie llevando talón al glúteo (30s por pierna)",
        "Estiramiento de isquiotibiales sentado tocando la punta de los pies (30s)",
        "Estiramiento de glúteos en el suelo cruzando una pierna sobre la otra (30s)"
      ];
    } else { // Full Body
      warmup = [
        noEquipment ? "5 min de trote suave en el sitio" : "5 min de elíptica o trote suave",
        "Movilidad articular general (cuello, hombros, cadera, rodillas)",
        "Sentadillas corporales + flexiones inclinadas (12 reps de cada una)",
        "Plancha abdominal corta (30s de activación del core)"
      ];
      cooldown = [
        "Estiramiento general de cadena posterior inclinando torso hacia el suelo (45s)",
        "Estiramiento cruzado de hombros y pectoral (30s por músculo)",
        "Postura del niño (Yoga Child's Pose) para relajar la espalda baja (1 min)"
      ];
    }

    return {
      id: randomUUID(),
      split,
      goal,
      warmup,
      exercises: exercisesWithSets,
      cooldown,
      createdAt: new Date().toISOString(),
      isCompleted: false
    };
  }

  public async rerollExercise(
    targetMuscle: string,
    excludedIds: string[],
    profile: UserProfile,
    history: ExerciseHistorySummary[] = []
  ): Promise<WorkoutExercise> {
    const rawExercises = await this.exerciseRepository.getAll();
    const allExercises = this.filterByEquipment(rawExercises, profile.equipment);

    // Filter matching muscle and not excluded
    let candidates = allExercises.filter(
      ex => ex.target_muscle.toLowerCase() === targetMuscle.toLowerCase() && !excludedIds.includes(ex.id)
    );

    // If no candidate of same muscle, widen search to same split category
    if (candidates.length === 0) {
      const splitMapping = {
        'Tren Superior': 'tren_superior',
        'Tren Inferior': 'tren_inferior',
        'Full Body': 'ambos'
      };
      const category = splitMapping[profile.split] || 'tren_superior';
      candidates = allExercises.filter(
        ex => (ex.split_category === category || ex.split_category === 'ambos') && !excludedIds.includes(ex.id)
      );
    }

    // If still no candidates, fallback to anything not excluded
    if (candidates.length === 0) {
      candidates = allExercises.filter(ex => !excludedIds.includes(ex.id));
    }

    // Default fallback to first exercise if still empty
    const selectedExercise = candidates.length > 0
      ? candidates[Math.floor(this.rng() * candidates.length)]
      : allExercises[0];

    const numSets = profile.goal === 'Volumen' ? 4 : 3;
    const restTimerSeconds = profile.goal === 'Perder Peso' ? 60 : profile.goal === 'Volumen' ? 120 : 90;

    const historyMap = new Map(history.map(h => [h.exerciseId, h.lastSession]));
    const prescription = this.progressionService.prescribe(
      selectedExercise,
      profile.goal,
      historyMap.get(selectedExercise.id)
    );
    const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
      setIndex: i + 1,
      suggestedReps: prescription.suggestedReps,
      suggestedWeightKg: prescription.suggestedWeightKg,
    }));

    return {
      exercise: selectedExercise,
      sets,
      restTimerSeconds,
      ...(prescription.direction ? { progressionDirection: prescription.direction } : {}),
    };
  }

  /** 'gym' permite todo el catálogo; 'none' restringe a ejercicios sin material. */
  private filterByEquipment(exercises: Exercise[], equipment: UserProfile['equipment']): Exercise[] {
    if (equipment === 'none') {
      return exercises.filter(e => e.equipment === 'none');
    }
    return exercises;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Saca un ejercicio del pool; prefiere frescos (sin historial reciente) 80% del tiempo. */
  private takeWithBias(pool: Exercise[], historyIds: Set<string>): Exercise | undefined {
    if (pool.length === 0) return undefined;
    const freshIndex = pool.findIndex(e => !historyIds.has(e.id));
    // If a fresh exercise exists, pick it 80% of the time; otherwise fall back to index 0
    const index = freshIndex >= 0 && this.rng() < 0.8 ? freshIndex : 0;
    return pool.splice(index, 1)[0];
  }
}
