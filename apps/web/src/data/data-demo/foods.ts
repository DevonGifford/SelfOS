import type { Foods } from "@/data/schemas/foods";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

export const demoFoods: Foods = [
  {
    id: "food-1",
    name: "Chicken breast",
    servingLabel: "100g",
    caloriesPerServing: 165,
    proteinPerServing: 31,
    carbsPerServing: 0,
    fatPerServing: 3.6,
    createdAt: daysAgo(30),
  },
  {
    id: "food-2",
    name: "Rolled oats",
    servingLabel: "1 cup",
    caloriesPerServing: 307,
    proteinPerServing: 11,
    carbsPerServing: 55,
    fatPerServing: 5,
    createdAt: daysAgo(30),
  },
  {
    id: "food-3",
    name: "Greek yogurt",
    servingLabel: "170g",
    caloriesPerServing: 100,
    proteinPerServing: 17,
    carbsPerServing: 6,
    fatPerServing: 0.5,
    createdAt: daysAgo(28),
  },
  {
    id: "food-4",
    name: "Banana",
    servingLabel: "1 medium",
    caloriesPerServing: 105,
    proteinPerServing: 1.3,
    carbsPerServing: 27,
    fatPerServing: 0.4,
    createdAt: daysAgo(28),
  },
  {
    id: "food-5",
    name: "Almonds",
    servingLabel: "28g",
    caloriesPerServing: 164,
    proteinPerServing: 6,
    carbsPerServing: 6,
    fatPerServing: 14,
    createdAt: daysAgo(20),
  },
];
