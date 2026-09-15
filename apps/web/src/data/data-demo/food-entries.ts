import { demoFoods } from "@/data/data-demo/foods";
import type { FoodEntries } from "@/data/schemas/food-entries";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

function entryFor(id: string, foodId: string, quantity: number, days: number): FoodEntries[number] {
  const food = demoFoods.find((f) => f.id === foodId);
  if (!food) throw new Error(`demo food-entries: unknown foodId ${foodId}`);

  return {
    id,
    foodId: food.id,
    name: food.name,
    quantity,
    calories: Math.round(food.caloriesPerServing * quantity),
    protein: Math.round(food.proteinPerServing * quantity),
    carbs: Math.round(food.carbsPerServing * quantity),
    fat: Math.round(food.fatPerServing * quantity),
    date: daysAgo(days),
    createdAt: daysAgoIso(days),
  };
}

// Macros computed from foods.ts here (not hand-typed) so they can't drift
// out of sync with it — matches how guest-client.ts derives them for real
// at log time.
export const demoFoodEntries: FoodEntries = [
  entryFor("food-entry-1", "food-2", 1, 2),
  entryFor("food-entry-2", "food-4", 1, 2),
  entryFor("food-entry-3", "food-1", 1.5, 1),
  entryFor("food-entry-4", "food-3", 1, 1),
  entryFor("food-entry-5", "food-2", 1, 0),
  entryFor("food-entry-6", "food-5", 1, 0),
];
