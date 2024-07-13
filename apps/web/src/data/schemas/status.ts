import { z } from "zod";

import { SessionWorkoutTypeSchema } from "@/data/schemas/training-shared";

const MacroTotalSchema = z.object({
  consumed: z.number(),
  target: z.number(),
});

export const StatusSchema = z.object({
  training: z.object({
    lastFinishedSession: z
      .object({ id: z.string(), workoutType: SessionWorkoutTypeSchema, date: z.string() })
      .nullable(),
    unfinishedSession: z
      .object({ id: z.string(), workoutType: SessionWorkoutTypeSchema })
      .nullable(),
  }),
  nutrition: z.object({
    calories: MacroTotalSchema,
    protein: MacroTotalSchema,
    carbs: MacroTotalSchema,
    fat: MacroTotalSchema,
  }),
  habits: z.object({
    completed: z.number(),
    total: z.number(),
  }),
});

export type Status = z.infer<typeof StatusSchema>;
