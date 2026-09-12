import { z } from "zod";

export const TrainingDaySchema = z.enum(["push", "pull", "legs", "cardio", "rest"]);

export const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number(),
});

export const TrainingSchema = z.object({
  type: TrainingDaySchema,
  split: z.string(),
  tomorrow: z.string(),
  exercises: z.array(ExerciseSchema),
});

export type TrainingDay = z.infer<typeof TrainingDaySchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Training = z.infer<typeof TrainingSchema>;
