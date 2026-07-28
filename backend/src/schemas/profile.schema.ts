import { z } from 'zod';

/** ~400 KB de base64 ≈ 300 KB de imagen: de sobra para un avatar de 256px */
export const MAX_AVATAR_CHARS = 400_000;

/** Solo data URLs de imagen: nada de URLs remotas ni de otros esquemas (javascript:, data:text/html…) */
export const AVATAR_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const AvatarSchema = z.object({
  avatarUrl: z
    .string()
    .max(MAX_AVATAR_CHARS, 'La imagen es demasiado grande')
    .regex(AVATAR_DATA_URL, 'Formato de imagen no válido (usa PNG, JPEG o WebP)'),
});
