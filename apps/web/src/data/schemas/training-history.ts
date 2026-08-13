import { z } from "zod";

const trainingSessionBaseSchema = z.object({
  id: z.string(),
  date: z.string(),
  durationMinutes: z.number(),
});

export const StrengthSessionSchema = trainingSessionBaseSchema.extend({
  type: z.literal("strength"),
  routine: z.enum(["push", "pull", "legs"]),
  workingSetsCompleted: z.number(),
  workingSetsPlanned: z.number(),
  setsDelta: z.number().nullable(),
  repsCompleted: z.number(),
  repsPlanned: z.number(),
  repsDelta: z.number().nullable(),
  durationDeltaMinutes: z.number().nullable(),
  volumeKg: z.number(),
  volumeDeltaPercent: z.number().nullable(),
  personalRecords: z.number(),
});

export const CardioSessionSchema = trainingSessionBaseSchema.extend({
  type: z.literal("cardio"),
  activity: z.enum(["run", "walk", "cycle", "swim"]),
  durationDeltaMinutes: z.number().nullable(),
  distanceKm: z.number(),
  distanceDeltaKm: z.number().nullable(),
  averagePaceSecondsPerKm: z.number().nullable(),
  averagePaceDeltaSecondsPerKm: z.number().nullable(),
  averageSpeedKmh: z.number().nullable(),
  averageSpeedDeltaKmh: z.number().nullable(),
  averageSwimPaceSecondsPer100m: z.number().nullable(),
  averageSwimPaceDeltaSecondsPer100m: z.number().nullable(),
});

export const TrainingSessionSchema = z.discriminatedUnion("type", [
  StrengthSessionSchema,
  CardioSessionSchema,
]);

export const TrainingHistorySchema = z.array(TrainingSessionSchema);

export type StrengthSession = z.infer<typeof StrengthSessionSchema>;
export type CardioSession = z.infer<typeof CardioSessionSchema>;
export type TrainingSession = z.infer<typeof TrainingSessionSchema>;
export type TrainingHistory = z.infer<typeof TrainingHistorySchema>;
