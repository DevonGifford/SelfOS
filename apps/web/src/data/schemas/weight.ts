import { z } from "zod";

export const WeightEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  kg: z.number(),
  createdAt: z.string().optional(),
});

export const WeightSchema = z.array(WeightEntrySchema);

export type WeightEntry = z.infer<typeof WeightEntrySchema>;
export type Weight = z.infer<typeof WeightSchema>;
