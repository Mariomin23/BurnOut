import { Exercise } from '../types';
import {
  IExerciseRepository,
  SearchOptions,
  SEARCH_DEFAULT_LIMIT,
  normalizeText,
} from './exerciseRepository';
import { ExerciseModel } from '../models/exercise.model';

const ACCENT_CLASSES: Record<string, string> = {
  a: '[aáàäâ]',
  e: '[eéèëê]',
  i: '[iíìïî]',
  o: '[oóòöô]',
  u: '[uúùüû]',
  n: '[nñ]',
  c: '[cç]',
};

/**
 * $regex ignora la collation de Mongo, así que la insensibilidad a tildes se
 * construye en el propio patrón: "biceps" pasa a casar también con "Bíceps".
 * El término del usuario se escapa antes para neutralizar los metacaracteres.
 */
export function buildSearchPattern(term: string): RegExp {
  const escaped = normalizeText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tolerant = escaped.replace(/[aeiounc]/g, char => ACCENT_CLASSES[char]);
  return new RegExp(tolerant, 'i');
}

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

  public async search(query: string, options: SearchOptions = {}): Promise<Exercise[]> {
    const { equipment, limit = SEARCH_DEFAULT_LIMIT } = options;
    if (query.trim().length === 0) return [];

    const pattern = buildSearchPattern(query);
    const filter: Record<string, unknown> = {
      $or: [{ name: pattern }, { target_muscle: pattern }],
    };
    if (equipment) filter.equipment = equipment;

    const docs = await ExerciseModel.find(filter).limit(limit).lean();
    return docs.map(({ _id, ...exercise }) => exercise as Exercise);
  }
}
