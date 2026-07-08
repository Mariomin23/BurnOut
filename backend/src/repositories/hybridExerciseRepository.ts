import { Exercise } from '../types';
import { IExerciseRepository, JsonExerciseRepository } from './exerciseRepository';
import { MongoExerciseRepository } from './mongoExerciseRepository';
import { isDbConnected } from '../db/connection';

/**
 * Usa MongoDB cuando hay conexión y la colección tiene datos;
 * en cualquier otro caso cae al JSON estático. La capa de servicios
 * no sabe cuál de los dos está respondiendo (patrón repositorio).
 */
export class HybridExerciseRepository implements IExerciseRepository {
  private json = new JsonExerciseRepository();
  private mongo = new MongoExerciseRepository();

  public async getAll(): Promise<Exercise[]> {
    if (isDbConnected()) {
      try {
        const exercises = await this.mongo.getAll();
        if (exercises.length > 0) return exercises;
      } catch (error) {
        console.error('Mongo getAll falló — fallback a JSON:', error);
      }
    }
    return this.json.getAll();
  }

  public async getById(id: string): Promise<Exercise | null> {
    if (isDbConnected()) {
      try {
        const exercise = await this.mongo.getById(id);
        if (exercise) return exercise;
      } catch (error) {
        console.error('Mongo getById falló — fallback a JSON:', error);
      }
    }
    return this.json.getById(id);
  }
}
