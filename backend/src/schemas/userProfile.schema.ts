import { z } from 'zod';

export const UserProfileSchema = z.object({
  weightKg: z.number().positive().max(300),
  heightCm: z.number().positive().max(250),
  age: z.number().int().min(14).max(100),
  sex: z.enum(['masculino', 'femenino']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  split: z.enum(['Tren Superior', 'Tren Inferior', 'Full Body']),
  goal: z.enum(['Perder Peso', 'Volumen', 'Mantenerse Activo']),
  // default 'gym' para clientes antiguos que no envían la preferencia de material
  equipment: z.enum(['gym', 'none']).default('gym'),
});

export const RerollRequestSchema = z.object({
  targetMuscle: z.enum(['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos', 'Core', 'Cardio', 'Full Body']),
  excludedIds: z.array(z.string()),
  profile: UserProfileSchema,
});

export const ExerciseSetLogSchema = z.object({
  weightKg: z.number().min(0).max(500),
  reps: z.number().int().min(0).max(100),
  rpe: z.number().min(1).max(10),
});

export const HistorySchema = z
  .array(
    z.object({
      exerciseId: z.string(),
      lastSession: z.object({
        date: z.string(),
        goal: z.enum(['Perder Peso', 'Volumen', 'Mantenerse Activo']),
        sets: z.array(ExerciseSetLogSchema).max(10),
      }),
    })
  )
  .max(30);
