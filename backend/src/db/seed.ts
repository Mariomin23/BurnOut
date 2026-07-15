import { Exercise } from '../types';
import { ExerciseModel } from '../models/exercise.model';
import exercisesData from '../data/exercises.json';

/**
 * Sincroniza exercises.json (fuente de verdad) con MongoDB:
 * 1. Upserts todos los ejercicios del JSON.
 * 2. Elimina de la DB cualquier ejercicio cuyo ID no esté en el JSON
 *    (limpia ejercicios obsoletos de versiones anteriores).
 */
export async function syncExercisesToDb(): Promise<number> {
  const exercises = exercisesData as Exercise[];
  const currentIds = exercises.map(e => e.id);

  await ExerciseModel.bulkWrite(
    exercises.map(exercise => ({
      updateOne: {
        filter: { id: exercise.id },
        update: { $set: exercise },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const deleted = await ExerciseModel.deleteMany({ id: { $nin: currentIds } });
  if (deleted.deletedCount > 0) {
    console.log(`Eliminados ${deleted.deletedCount} ejercicios obsoletos de MongoDB`);
  }

  const total = await ExerciseModel.countDocuments();
  console.log(`Ejercicios en DB: ${total}`);
  return total;
}
