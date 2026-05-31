import { demoFoodEntries } from "@/data/data-demo/food-entries";
import { demoFoods } from "@/data/data-demo/foods";
import { demoHabitEntries } from "@/data/data-demo/habit-entries";
import { demoHabits } from "@/data/data-demo/habits";
import { demoWeight } from "@/data/data-demo/weight";
import type { FoodEntry } from "@/data/schemas/food-entries";
import type { Food } from "@/data/schemas/foods";
import type { HabitEntry } from "@/data/schemas/habit-entries";
import type { Habit } from "@/data/schemas/habits";
import type { WeightEntry } from "@/data/schemas/weight";

// Guest mode's fake backend — a session-scoped, mutable, in-memory store
// seeded from the same data-demo/ fixtures the real app used before each
// domain went real. Getters read from it and mutations write to it, so a
// guest's changes survive a TanStack refetch (window-focus, etc) and only
// vanish when this module is reloaded — i.e. on the hard navigation both
// login and logout already do. Nothing here ever calls fetch().
let measurements: WeightEntry[] = [...demoWeight];
let habits: Habit[] = [...demoHabits];
let habitEntries: HabitEntry[] = [...demoHabitEntries];
let foods: Food[] = [...demoFoods];
let foodEntries: FoodEntry[] = [...demoFoodEntries];

function guestId(): string {
  return `guest-${Math.random().toString(36).slice(2)}`;
}

type MeasurementInput = { date: string; kg: number };

export async function getMeasurements(): Promise<WeightEntry[]> {
  return [...measurements];
}

export async function createMeasurement(input: MeasurementInput): Promise<WeightEntry> {
  const created: WeightEntry = { id: guestId(), ...input, createdAt: new Date().toISOString() };
  measurements = [created, ...measurements];
  return created;
}

export async function updateMeasurement(id: string, input: MeasurementInput): Promise<WeightEntry> {
  const existing = measurements.find((m) => m.id === id);
  if (!existing) throw new Error(`guest-client: unknown measurement ${id}`);

  const updated: WeightEntry = { ...existing, ...input };
  measurements = measurements.map((m) => (m.id === id ? updated : m));
  return updated;
}

export async function deleteMeasurement(id: string): Promise<void> {
  measurements = measurements.filter((m) => m.id !== id);
}

export async function getHabits(): Promise<Habit[]> {
  return [...habits];
}

export async function createHabit(name: string): Promise<Habit> {
  const created: Habit = {
    id: guestId(),
    name,
    active: true,
    position: habits.length,
    createdAt: new Date().toISOString(),
  };
  habits = [...habits, created];
  return created;
}

export async function updateHabit(
  id: string,
  input: { name?: string; active?: boolean },
): Promise<Habit> {
  const existing = habits.find((h) => h.id === id);
  if (!existing) throw new Error(`guest-client: unknown habit ${id}`);

  const updated: Habit = { ...existing, ...input };
  habits = habits.map((h) => (h.id === id ? updated : h));
  return updated;
}

export async function reorderHabits(ids: string[]): Promise<void> {
  const byId = new Map(habits.map((h) => [h.id, h]));
  habits = ids
    .map((id, index) => {
      const habit = byId.get(id);
      return habit ? { ...habit, position: index } : undefined;
    })
    .filter((h): h is Habit => h !== undefined);
}

export async function getHabitEntries(): Promise<HabitEntry[]> {
  return [...habitEntries];
}

export async function createHabitEntry(input: { habitId: string; date: string }): Promise<HabitEntry> {
  const created: HabitEntry = { id: guestId(), ...input, createdAt: new Date().toISOString() };
  habitEntries = [...habitEntries, created];
  return created;
}

export async function deleteHabitEntry(id: string): Promise<void> {
  habitEntries = habitEntries.filter((e) => e.id !== id);
}

type FoodInput = {
  name: string;
  servingLabel: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
};

export async function getFoods(): Promise<Food[]> {
  return [...foods];
}

export async function createFood(input: FoodInput): Promise<Food> {
  const created: Food = { id: guestId(), ...input, createdAt: new Date().toISOString() };
  foods = [...foods, created];
  return created;
}

export async function updateFood(id: string, input: Partial<FoodInput>): Promise<Food> {
  const existing = foods.find((f) => f.id === id);
  if (!existing) throw new Error(`guest-client: unknown food ${id}`);

  const updated: Food = { ...existing, ...input };
  foods = foods.map((f) => (f.id === id ? updated : f));
  return updated;
}

export async function deleteFood(id: string): Promise<void> {
  foods = foods.filter((f) => f.id !== id);
}

export async function getFoodEntries(): Promise<FoodEntry[]> {
  return [...foodEntries];
}

// The one spot with real logic: macros are server-derived from quantity ×
// the referenced Food row in the real API, so they have to be computed
// here too rather than echoed from the input (the input doesn't carry
// them at all).
export async function createFoodEntry(input: {
  foodId: string;
  quantity: number;
  date: string;
}): Promise<FoodEntry> {
  const food = foods.find((f) => f.id === input.foodId);
  if (!food) throw new Error(`guest-client: unknown food ${input.foodId}`);

  const created: FoodEntry = {
    id: guestId(),
    foodId: food.id,
    name: food.name,
    quantity: input.quantity,
    calories: Math.round(food.caloriesPerServing * input.quantity),
    protein: Math.round(food.proteinPerServing * input.quantity),
    carbs: Math.round(food.carbsPerServing * input.quantity),
    fat: Math.round(food.fatPerServing * input.quantity),
    date: input.date,
    createdAt: new Date().toISOString(),
  };
  foodEntries = [...foodEntries, created];
  return created;
}

export async function updateFoodEntry(id: string, quantity: number): Promise<FoodEntry> {
  const existing = foodEntries.find((e) => e.id === id);
  if (!existing) throw new Error(`guest-client: unknown food entry ${id}`);

  const food = existing.foodId ? foods.find((f) => f.id === existing.foodId) : undefined;
  const updated: FoodEntry = food
    ? {
        ...existing,
        quantity,
        calories: Math.round(food.caloriesPerServing * quantity),
        protein: Math.round(food.proteinPerServing * quantity),
        carbs: Math.round(food.carbsPerServing * quantity),
        fat: Math.round(food.fatPerServing * quantity),
      }
    : { ...existing, quantity };

  foodEntries = foodEntries.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  foodEntries = foodEntries.filter((e) => e.id !== id);
}
