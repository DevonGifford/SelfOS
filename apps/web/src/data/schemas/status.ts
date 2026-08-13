import { z } from "zod";

import { TrainingDaySchema } from "@/data/schemas/training";

const MacroTotalSchema = z.object({
  consumed: z.number(),
  target: z.number(),
});

export const StatusSchema = z.object({
  training: z.object({
    type: TrainingDaySchema,
    focus: z.string(),
    tomorrow: z.string(),
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
  measurements: z.object({
    kg: z.number(),
  }),
});

export type Status = z.infer<typeof StatusSchema>;
