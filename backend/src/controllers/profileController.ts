import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { AvatarSchema } from '../schemas/profile.schema';

export class ProfileController {
  /** GET /api/profile/me */
  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findById(req.userId).select('email role avatarUrl favorites');
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        favoritesCount: user.favorites.length,
      });
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      res.status(500).json({ error: 'Error interno al obtener el perfil' });
    }
  };

  /** PUT /api/profile/avatar — la imagen llega ya redimensionada como data URL */
  public updateAvatar = async (req: Request, res: Response): Promise<void> => {
    const result = AvatarSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0]?.message ?? 'Imagen no válida' });
      return;
    }
    try {
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { avatarUrl: result.data.avatarUrl },
        { new: true, select: 'avatarUrl' }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ avatarUrl: user.avatarUrl });
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      res.status(500).json({ error: 'Error interno al guardar la foto' });
    }
  };

  /** DELETE /api/profile/avatar */
  public deleteAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        { $unset: { avatarUrl: '' } },
        { new: true }
      );
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json({ avatarUrl: null });
    } catch (error) {
      console.error('Error al eliminar la foto de perfil:', error);
      res.status(500).json({ error: 'Error interno al eliminar la foto' });
    }
  };
}
