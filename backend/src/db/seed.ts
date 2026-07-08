import { Exercise } from '../types';
import { ExerciseModel } from '../models/exercise.model';
import exercisesData from '../data/exercises.json';

/**
 * Sincroniza exercises.json (fuente de verdad, versionada en git) con la
 * colección de MongoDB mediante upserts idempotentes. Se ejecuta en cada
 * arranque con conexión: un deploy con ejercicios nuevos actualiza la BBDD solo.
 */
export async function syncExercisesToDb(): Promise<number> {
  const exercises = exercisesData as Exercise[];
  const result = await ExerciseModel.bulkWrite(
    exercises.map(exercise => ({
      updateOne: {
        filter: { id: exercise.id },
        update: { $set: exercise },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  const total = await ExerciseModel.countDocuments();
  console.log(
    `Ejercicios sincronizados con MongoDB: ${result.upsertedCount} nuevos, ${result.modifiedCount} actualizados, ${total} en total`
  );
  return total;
}
