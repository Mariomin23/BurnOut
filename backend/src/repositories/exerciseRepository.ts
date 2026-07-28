import { Exercise, EquipmentCategory } from '../types';
import exercisesData from '../data/exercises.json';

const exercises = exercisesData as Exercise[];

export interface SearchOptions {
  equipment?: EquipmentCategory;
  limit?: number;
}

export const SEARCH_DEFAULT_LIMIT = 20;

/** minúsculas y sin tildes: "Bíceps" y "biceps" deben encontrarse igual */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  search(query: string, options?: SearchOptions): Promise<Exercise[]>;
}

export class JsonExerciseRepository implements IExerciseRepository {
  public async getAll(): Promise<Exercise[]> {
    return exercises;
  }

  public async getById(id: string): Promise<Exercise | null> {
    return exercises.find(ex => ex.id === id) || null;
  }

  public async search(query: string, options: SearchOptions = {}): Promise<Exercise[]> {
    const { equipment, limit = SEARCH_DEFAULT_LIMIT } = options;
    const needle = normalizeText(query);
    if (needle.length === 0) return [];

    return exercises
      .filter(ex => !equipment || ex.equipment === equipment)
      .filter(ex =>
        normalizeText(ex.name).includes(needle) ||
        normalizeText(ex.target_muscle).includes(needle)
      )
      .slice(0, limit);
  }
}
