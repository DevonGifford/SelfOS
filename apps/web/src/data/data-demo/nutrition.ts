import type { Meal, Nutrition } from "@/data/schemas/nutrition";

const meals: Meal[] = [
  {
    id: "meal-1",
    name: "Oats & berries",
    calories: 420,
    protein: 18,
    carbs: 62,
    fat: 10,
  },
  {
    id: "meal-2",
    name: "Chicken, rice & greens",
    calories: 680,
    protein: 52,
    carbs: 74,
    fat: 14,
  },
  {
    id: "meal-3",
    name: "Protein shake",
    calories: 240,
    protein: 30,
    carbs: 12,
    fat: 4,
  },
  {
    id: "meal-4",
    name: "Salmon & sweet potato",
    calories: 500,
    protein: 38,
    carbs: 48,
    fat: 16,
  },
];

const targets = {
  calories: 2300,
  protein: 165,
  carbs: 220,
  fat: 70,
};

function consumed(macro: keyof typeof targets) {
  return meals.reduce((total, meal) => total + meal[macro], 0);
}

export const demoNutrition: Nutrition = {
  totals: {
    calories: { consumed: consumed("calories"), target: targets.calories },
    protein: { consumed: consumed("protein"), target: targets.protein },
    carbs: { consumed: consumed("carbs"), target: targets.carbs },
    fat: { consumed: consumed("fat"), target: targets.fat },
  },
  meals,
};
