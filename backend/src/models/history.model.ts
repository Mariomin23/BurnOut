import { Schema, model, Types } from 'mongoose';

export interface WorkoutLogEntry {
  id: string;
  date: string;
  split: string;
  goal: string;
  totalVolumeKg: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    targetMuscle: string;
    sets: Array<{ weightKg: number; reps: number; rpe: number }>;
  }>;
}

export interface HistoryDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  logs: WorkoutLogEntry[];
  updatedAt: Date;
}

const setSchema = new Schema(
  { weightKg: Number, reps: Number, rpe: Number },
  { _id: false }
);

const exerciseLogSchema = new Schema(
  { exerciseId: String, exerciseName: String, targetMuscle: String, sets: [setSchema] },
  { _id: false }
);

const workoutLogSchema = new Schema(
  { id: String, date: String, split: String, goal: String, totalVolumeKg: Number, exercises: [exerciseLogSchema] },
  { _id: false }
);

const historySchema = new Schema<HistoryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    logs: { type: [workoutLogSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const HistoryModel = model<HistoryDoc>('History', historySchema);
