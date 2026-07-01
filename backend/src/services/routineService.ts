import { randomUUID } from 'crypto';
import { IExerciseRepository } from '../repositories/exerciseRepository';
import { 
  Exercise, 
  WorkoutRoutine, 
  WorkoutExercise, 
  RoutineSet, 
  UserProfile, 
  Difficulty, 
  Sex 
} from '../types';

export class RoutineService {
  constructor(private exerciseRepository: IExerciseRepository) {}

  public async generateRoutine(profile: UserProfile): Promise<WorkoutRoutine> {
    const rawExercises = await this.exerciseRepository.getAll();
    const allExercises = this.filterByDifficulty(rawExercises, profile.experience);
    const split = profile.split;
    const goal = profile.goal;

    // 1. Select exercises (5-6 exercises)
    let selectedExercises: Exercise[] = [];
    if (split === 'Tren Superior') {
      const upperExs = allExercises.filter(ex => ex.split_category === 'tren_superior');
      // Group by target muscle to balance: Pecho, Espalda, Hombros, Bíceps, Tríceps
      const pecho = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Espalda'));
      const hombros = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Hombros'));
      const biceps = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Bíceps'));
      const triceps = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Tríceps'));

      // Build routine: 2 Pecho, 2 Espalda, 1 Hombro, 1 Brazo (alternating biceps/triceps)
      if (pecho[0]) selectedExercises.push(pecho[0]);
      if (espalda[0]) selectedExercises.push(espalda[0]);
      if (pecho[1]) selectedExercises.push(pecho[1]);
      if (espalda[1]) selectedExercises.push(espalda[1]);
      if (hombros[0]) selectedExercises.push(hombros[0]);
      
      const arm = Math.random() > 0.5 ? biceps[0] : triceps[0];
      if (arm) selectedExercises.push(arm);
    } else if (split === 'Tren Inferior') {
      const lowerExs = allExercises.filter(ex => ex.split_category === 'tren_inferior');
      const cuádriceps = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Femorales'));
      const gluteos = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Glúteos'));
      const gemelos = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Gemelos'));

      // Build routine: 2 Cuadriceps, 2 Femorales, 1 Gluteo, 1 Gemelos
      if (cuádriceps[0]) selectedExercises.push(cuádriceps[0]);
      if (femorales[0]) selectedExercises.push(femorales[0]);
      if (cuádriceps[1]) selectedExercises.push(cuádriceps[1]);
      if (femorales[1]) selectedExercises.push(femorales[1]);
      if (gluteos[0]) selectedExercises.push(gluteos[0]);
      if (gemelos[0]) selectedExercises.push(gemelos[0]);
    } else {
      // Full Body
      const upperExs = allExercises.filter(ex => ex.split_category === 'tren_superior');
      const lowerExs = allExercises.filter(ex => ex.split_category === 'tren_inferior');
      const ambosExs = allExercises.filter(ex => ex.split_category === 'ambos');

      const pecho = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Pecho'));
      const espalda = this.shuffle(upperExs.filter(ex => ex.target_muscle === 'Espalda'));
      const cuádriceps = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Cuádriceps'));
      const femorales = this.shuffle(lowerExs.filter(ex => ex.target_muscle === 'Femorales'));
      const core = this.shuffle(ambosExs.filter(ex => ex.target_muscle === 'Core'));

      // Build routine: 1 Pecho, 1 Espalda, 1 Cuádriceps, 1 Femorales, 1 Core, 1 extra (compound)
      if (pecho[0]) selectedExercises.push(pecho[0]);
      if (cuádriceps[0]) selectedExercises.push(cuádriceps[0]);
      if (espalda[0]) selectedExercises.push(espalda[0]);
      if (femorales[0]) selectedExercises.push(femorales[0]);
      if (core[0]) selectedExercises.push(core[0]);
      
      const extraCompound = ambosExs.find(ex => ex.target_muscle !== 'Core' && !selectedExercises.map(e => e.id).includes(ex.id));
      if (extraCompound) selectedExercises.push(extraCompound);
    }

    // Ensure we have at least 5-6 exercises
    selectedExercises = selectedExercises.filter(Boolean).slice(0, 6);

    // 2. Determine sets, reps, rest timers, and weights suggestions
    const numSets = goal === 'Volumen' ? 4 : 3;
    let targetReps = 12;
    let restTimerSeconds = 90;

    if (goal === 'Perder Peso') {
      targetReps = 15;
      restTimerSeconds = 60;
    } else if (goal === 'Volumen') {
      targetReps = 10; // 8-12 reps range, we suggest 10
      restTimerSeconds = 120;
    } else { // Mantenerse Activo
      targetReps = 12;
      restTimerSeconds = 90;
    }

    const exercisesWithSets: WorkoutExercise[] = selectedExercises.map(exercise => {
      const suggestedWeight = this.calculateSuggestedWeight(exercise, profile);
      const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
        setIndex: i + 1,
        suggestedReps: targetReps,
        suggestedWeightKg: suggestedWeight
      }));

      return {
        exercise,
        sets,
        restTimerSeconds
      };
    });

    // 3. Inject warm-up and cool-down
    let warmup: string[] = [];
    let cooldown: string[] = [];

    if (split === 'Tren Superior') {
      warmup = [
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
        "5 min de caminata en cinta con pendiente",
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
        "5 min de elíptica o trote suave",
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
    profile: UserProfile
  ): Promise<WorkoutExercise> {
    const rawExercises = await this.exerciseRepository.getAll();
    const allExercises = this.filterByDifficulty(rawExercises, profile.experience);

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
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : allExercises[0];

    // Determine sets, reps, rest, weight suggestions
    const numSets = profile.goal === 'Volumen' ? 4 : 3;
    let targetReps = 12;
    let restTimerSeconds = 90;

    if (profile.goal === 'Perder Peso') {
      targetReps = 15;
      restTimerSeconds = 60;
    } else if (profile.goal === 'Volumen') {
      targetReps = 10;
      restTimerSeconds = 120;
    }

    const suggestedWeight = this.calculateSuggestedWeight(selectedExercise, profile);
    const sets: RoutineSet[] = Array.from({ length: numSets }, (_, i) => ({
      setIndex: i + 1,
      suggestedReps: targetReps,
      suggestedWeightKg: suggestedWeight
    }));

    return {
      exercise: selectedExercise,
      sets,
      restTimerSeconds
    };
  }

  // Baseline load for the muscle's reference compound lift, as fraction of bodyweight (intermediate level)
  private static readonly MUSCLE_BASE_FACTOR: Record<string, number> = {
    'Pecho': 0.5,       // Press de banca
    'Espalda': 0.5,     // Remo con barra
    'Hombros': 0.3,     // Press militar
    'Bíceps': 0.15,     // Curl con barra
    'Tríceps': 0.15,    // Press francés
    'Cuádriceps': 0.8,  // Sentadilla trasera
    'Femorales': 0.65,  // Peso muerto rumano
    'Glúteos': 0.65,    // Referencia cadena posterior
    'Gemelos': 0.9,     // Elevación de talones de pie
    'Core': 0.15,       // Lastre ligero (disco)
  };

  private static readonly EXPERIENCE_FACTOR: Record<Difficulty, number> = {
    beginner: 0.5,
    intermediate: 1,
    advanced: 1.6,
  };

  private calculateSuggestedWeight(exercise: Exercise, profile: UserProfile): number {
    const loadFactor = exercise.weight_factor ?? 1;
    if (loadFactor === 0) {
      return 0; // Bodyweight / autocarga
    }

    const muscle = exercise.target_muscle;
    let multiplier =
      (RoutineService.MUSCLE_BASE_FACTOR[muscle] ?? 0.2) *
      RoutineService.EXPERIENCE_FACTOR[profile.experience] *
      loadFactor;

    // Sex modifiers
    if (profile.sex === 'femenino') {
      if (muscle === 'Pecho' || muscle === 'Espalda' || muscle === 'Hombros') {
        multiplier *= 0.7; // Lower upper body suggested starting weights
      } else if (muscle === 'Glúteos' || muscle === 'Femorales') {
        multiplier *= 1.1; // Slightly higher relative strength in lower chain
      }
    }

    let suggested = profile.weightKg * multiplier;

    // Round to nearest standard dumbbell/plate jump (2.5 kg)
    suggested = Math.round(suggested / 2.5) * 2.5;

    // Cap at reasonable minimum
    if (suggested < 2.5) return 2.5;
    return suggested;
  }

  private filterByDifficulty(exercises: Exercise[], experience: Difficulty): Exercise[] {
    if (experience === 'beginner') {
      return exercises.filter(e => e.difficulty === 'beginner');
    }
    if (experience === 'intermediate') {
      return exercises.filter(e => e.difficulty !== 'advanced');
    }
    return exercises;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
