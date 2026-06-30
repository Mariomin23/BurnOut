import fs from 'fs';
import path from 'path';
import { Exercise } from '../types';

export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
}

export class JsonExerciseRepository implements IExerciseRepository {
  private filePath = path.join(__dirname, '../data/exercises.json');

  private loadExercises(): Exercise[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data) as Exercise[];
    } catch (error) {
      console.error('Error loading exercises from JSON file:', error);
      return [];
    }
  }

  public async getAll(): Promise<Exercise[]> {
    return this.loadExercises();
  }

  public async getById(id: string): Promise<Exercise | null> {
    const exercises = this.loadExercises();
    return exercises.find(ex => ex.id === id) || null;
  }
}
