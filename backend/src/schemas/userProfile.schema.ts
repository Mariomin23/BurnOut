import { z } from 'zod';

export const UserProfileSchema = z.object({
  weightKg: z.number().positive().max(300),
  heightCm: z.number().positive().max(250),
  age: z.number().int().min(14).max(100),
  sex: z.enum(['masculino', 'femenino', 'otro']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  split: z.enum(['Tren Superior', 'Tren Inferior', 'Full Body']),
  goal: z.enum(['Perder Peso', 'Volumen', 'Mantenerse Activo']),
});

export const RerollRequestSchema = z.object({
  targetMuscle: z.string().min(1),
  excludedIds: z.array(z.string()),
  profile: UserProfileSchema,
});

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;
export type ValidatedRerollRequest = z.infer<typeof RerollRequestSchema>;
