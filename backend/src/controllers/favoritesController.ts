import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ExerciseModel } from '../models/exercise.model';

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
    try {
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
