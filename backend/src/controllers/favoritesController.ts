import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ExerciseModel } from '../models/exercise.model';

/** Tope de favoritos por usuario: el array vive dentro del documento del usuario */
export const MAX_FAVORITES = 200;
const EXERCISE_ID_FORMAT = /^[A-Za-z0-9_-]{1,60}$/;

export class FavoritesController {
  /** GET /api/favorites → devuelve array de Exercise completo */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findById(req.userId).select('favorites');
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      if (user.favorites.length === 0) {
        res.json([]);
        return;
      }
      const exercises = await ExerciseModel.find({ id: { $in: user.favorites } }).lean();
      res.json(exercises);
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({ error: 'Error interno al obtener favoritos' });
    }
  };

  /** POST /api/favorites/:exerciseId → añade al array */
  public add = async (req: Request, res: Response): Promise<void> => {
    const { exerciseId } = req.params;
    if (!EXERCISE_ID_FORMAT.test(exerciseId)) {
      res.status(400).json({ error: 'Identificador de ejercicio no válido' });
      return;
    }
    try {
      if (!(await ExerciseModel.exists({ id: exerciseId }))) {
        res.status(404).json({ error: 'Ese ejercicio no existe en el catálogo' });
        return;
      }
      const current = await UserModel.findById(req.userId).select('favorites');
      if (!current) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      if (current.favorites.length >= MAX_FAVORITES && !current.favorites.includes(exerciseId)) {
        res.status(400).json({ error: `Has alcanzado el máximo de ${MAX_FAVORITES} favoritos` });
        return;
      }
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { $addToSet: { favorites: exerciseId } },
        { new: true, select: 'favorites' }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ favorites: user.favorites });
    } catch (error) {
      console.error('Error al añadir favorito:', error);
      res.status(500).json({ error: 'Error interno al añadir favorito' });
    }
  };

  /** DELETE /api/favorites/:exerciseId → elimina del array */
  public remove = async (req: Request, res: Response): Promise<void> => {
    const { exerciseId } = req.params;
    try {
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { $pull: { favorites: exerciseId } },
        { new: true, select: 'favorites' }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ favorites: user.favorites });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      res.status(500).json({ error: 'Error interno al eliminar favorito' });
    }
  };
}
