import { z } from "zod";

import { ExerciseTypeSchema, WorkoutTypeSchema } from "@/data/schemas/training-shared";

// An Exercise is the Definition (CONTEXT.md) — e.g. "Bench Press", tagged
// with a type (strength/cardio, deciding which Set fields apply) and a
// Workout Type (Push/Pull/Legs/Cardio — never Freestyle).
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ExerciseTypeSchema,
  workoutType: WorkoutTypeSchema,
  createdAt: z.string(),
});

export const ExercisesSchema = z.array(ExerciseSchema);

export type Exercise = z.infer<typeof ExerciseSchema>;
export type Exercises = z.infer<typeof ExercisesSchema>;
