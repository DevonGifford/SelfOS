import { demoHabits } from "@/data/data-demo/habits";
import { demoHabitsHistory } from "@/data/data-demo/habits-history";
import { demoNutrition } from "@/data/data-demo/nutrition";
import { demoWeight } from "@/data/data-demo/weight";

import { HabitsHistorySchema } from "@/data/schemas/habits-history";
import { HabitsSchema } from "@/data/schemas/habits";
import { NutritionSchema } from "@/data/schemas/nutrition";
import { WeightSchema } from "@/data/schemas/weight";

export async function getNutrition() {
  return NutritionSchema.parse(demoNutrition);
}

export async function getHabits() {
  return HabitsSchema.parse(demoHabits);
}

export async function getHabitsHistory() {
  return HabitsHistorySchema.parse(demoHabitsHistory);
}

export async function getMeasurements() {
  return WeightSchema.parse(demoWeight);
}
