export type SplitCategory = 'tren_superior' | 'tren_inferior' | 'ambos';
export type GoalCategory = 'perder_peso' | 'volumen' | 'mantenerse_activo';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Sex = 'masculino' | 'femenino';

export interface UserProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  experience: Difficulty;
  split: 'Tren Superior' | 'Tren Inferior' | 'Full Body';
  goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';
}

export interface Exercise {
  id: string;
  name: string;
  target_muscle: string;
  split_category: SplitCategory;
  difficulty: Difficulty;
  description: string;
  /** Load relative to the muscle's reference compound lift (0 = bodyweight/autocarga) */
  weight_factor: number;
}

export interface RoutineSet {
  setIndex: number;
  suggestedReps: number;
  suggestedWeightKg: number;
  completed?: boolean;
  completedReps?: number;
  completedWeightKg?: number;
  completedRpe?: number;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: RoutineSet[];
  restTimerSeconds: number;
}

export interface WorkoutRoutine {
  id: string;
  split: 'Tren Superior' | 'Tren Inferior' | 'Full Body';
  goal: 'Perder Peso' | 'Volumen' | 'Mantenerse Activo';
  warmup: string[];
  exercises: WorkoutExercise[];
  cooldown: string[];
  createdAt: string;
  isCompleted: boolean;
}
