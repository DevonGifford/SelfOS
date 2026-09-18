import { z } from "zod";

import { SetTypeSchema, WorkoutTypeSchema } from "@/data/schemas/training-shared";

// A Workout Template is the Definition (CONTEXT.md) — a named, reusable
// suggested list of exercises/order/sets to start a Session from. Each
// Workout Type has exactly one default (enforced server-side) plus zero or
// more archived/active alternates. Never belongs to Freestyle.
export const WorkoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  workoutType: WorkoutTypeSchema,
  isDefault: z.boolean(),
  archived: z.boolean(),
  createdAt: z.string(),
});

export const WorkoutTemplatesSchema = z.array(WorkoutTemplateSchema);

// One suggested set within a Template — fetched separately (GET
// /templates/{id}/sets), same flat-resource-the-client-correlates
// convention every other domain here uses rather than nested JSON.
export const WorkoutTemplateSetSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  exerciseId: z.string().nullable(),
  exerciseName: z.string(),
  position: z.number(),
  setType: SetTypeSchema,
  weightKg: z.number().nullable(),
  reps: z.number().nullable(),
  durationSec: z.number().nullable(),
  distanceM: z.number().nullable(),
});

export const WorkoutTemplateSetsSchema = z.array(WorkoutTemplateSetSchema);

export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;
export type WorkoutTemplates = z.infer<typeof WorkoutTemplatesSchema>;
export type WorkoutTemplateSet = z.infer<typeof WorkoutTemplateSetSchema>;
export type WorkoutTemplateSets = z.infer<typeof WorkoutTemplateSetsSchema>;
