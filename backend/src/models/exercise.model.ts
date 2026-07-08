import { Schema, model } from 'mongoose';
import { Exercise } from '../types';

const exerciseSchema = new Schema<Exercise>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    target_muscle: { type: String, required: true },
    split_category: { type: String, required: true, enum: ['tren_superior', 'tren_inferior', 'ambos'] },
    difficulty: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
    description: { type: String, required: true },
    weight_factor: { type: Number, required: true, min: 0 },
    equipment: { type: String, required: true, enum: ['gym', 'none'] },
  },
  { versionKey: false }
);

export const ExerciseModel = model<Exercise>('Exercise', exerciseSchema);
