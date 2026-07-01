import { Exercise } from '../types';
import exercisesData from '../data/exercises.json';

const exercises = exercisesData as Exercise[];

export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
}

export class JsonExerciseRepository implements IExerciseRepository {
  public async getAll(): Promise<Exercise[]> {
    return exercises;
  }

  public async getById(id: string): Promise<Exercise | null> {
    return exercises.find(ex => ex.id === id) || null;
  }
}
