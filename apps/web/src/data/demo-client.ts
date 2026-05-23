import { demoHabits } from "@/data/data-demo/habits";
import { demoHabitsHistory } from "@/data/data-demo/habits-history";
import { demoNutrition } from "@/data/data-demo/nutrition";
import { demoTraining } from "@/data/data-demo/training";
import { demoTrainingHistory } from "@/data/data-demo/training-history";
import { demoWeight } from "@/data/data-demo/weight";

import { HabitsHistorySchema } from "@/data/schemas/habits-history";
import { HabitsSchema } from "@/data/schemas/habits";
import { NutritionSchema } from "@/data/schemas/nutrition";
import { TrainingSchema } from "@/data/schemas/training";
import { TrainingHistorySchema } from "@/data/schemas/training-history";
import { WeightSchema } from "@/data/schemas/weight";

export async function getNutrition() {
  return NutritionSchema.parse(demoNutrition);
}

export async function getTraining() {
  return TrainingSchema.parse(demoTraining);
}

export async function getTrainingHistory() {
  return TrainingHistorySchema.parse(demoTrainingHistory);
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
