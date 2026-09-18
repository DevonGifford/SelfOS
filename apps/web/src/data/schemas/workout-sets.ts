import { z } from "zod";

import { SetTypeSchema } from "@/data/schemas/training-shared";

// A Workout Set is the Event (CONTEXT.md) — one logged set, weight/reps
// for a strength Exercise or duration/distance for a cardio one.
// `confirmed` backs the pending-rows-you-confirm interaction the logging
// UI settled on: a set seeded from a Template starts unconfirmed until the
// user taps to confirm it (or edits and confirms).
export const WorkoutSetSchema = z.object({
  id: z.string(),
  sessionExerciseId: z.string(),
  setType: SetTypeSchema,
  confirmed: z.boolean(),
  note: z.string().nullable(),
  weightKg: z.number().nullable(),
  reps: z.number().nullable(),
  durationSec: z.number().nullable(),
  distanceM: z.number().nullable(),
  createdAt: z.string(),
});

export const WorkoutSetsSchema = z.array(WorkoutSetSchema);

export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;
export type WorkoutSets = z.infer<typeof WorkoutSetsSchema>;
