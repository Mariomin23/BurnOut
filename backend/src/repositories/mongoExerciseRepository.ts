import { Exercise } from '../types';
import { IExerciseRepository } from './exerciseRepository';
import { ExerciseModel } from '../models/exercise.model';

export class MongoExerciseRepository implements IExerciseRepository {
  public async getAll(): Promise<Exercise[]> {
    const docs = await ExerciseModel.find().lean();
    return docs.map(({ _id, ...exercise }) => exercise as Exercise);
  }

  public async getById(id: string): Promise<Exercise | null> {
    const doc = await ExerciseModel.findOne({ id }).lean();
    if (!doc) return null;
    const { _id, ...exercise } = doc;
    return exercise as Exercise;
  }
}
