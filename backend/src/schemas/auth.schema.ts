import { z } from 'zod';

export const CredentialsSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
});

const SetLogSchema = z.object({
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(200),
  rpe: z.number().min(1).max(10),
});

const ExerciseLogSchema = z.object({
  exerciseId: z.string().max(60),
  exerciseName: z.string().max(160),
  targetMuscle: z.string().max(40),
  sets: z.array(SetLogSchema).max(12),
});

export const WorkoutLogSchema = z.object({
  id: z.string().max(60),
  date: z.string().max(40),
  split: z.string().max(40),
  goal: z.string().max(40),
  totalVolumeKg: z.number().min(0),
  exercises: z.array(ExerciseLogSchema).max(12),
});

export const HistoryPutSchema = z.object({
  logs: z.array(WorkoutLogSchema).max(100),
});
