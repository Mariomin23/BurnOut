import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { CredentialsSchema } from '../schemas/auth.schema';
import { hashPassword, verifyPassword, signToken } from '../services/authService';

export class AuthController {
  public register = async (req: Request, res: Response): Promise<void> => {
    const result = CredentialsSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Email o contraseña inválidos (mínimo 6 caracteres)' });
      return;
    }
    const { email, password } = result.data;
    try {
      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
        return;
      }
      const user = await UserModel.create({
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
      });
      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      });
      res.status(201).json({ token, email: user.email, role: user.role, avatarUrl: null });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno al crear la cuenta' });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const result = CredentialsSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Email o contraseña inválidos' });
      return;
    }
    const { email, password } = result.data;
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: 'Credenciales incorrectas' });
        return;
      }
      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      });
      res.json({ token, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? null });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno al iniciar sesión' });
    }
  };

  /** POST /api/auth/logout-all — invalida todos los tokens del usuario, en todos sus dispositivos */
  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      await UserModel.updateOne({ _id: req.userId }, { $inc: { tokenVersion: 1 } });
      res.json({ ok: true });
    } catch (error) {
      console.error('Error al cerrar todas las sesiones:', error);
      res.status(500).json({ error: 'Error interno al cerrar las sesiones' });
    }
  };
}
