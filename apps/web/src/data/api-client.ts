import { FoodEntriesSchema, FoodEntrySchema, type FoodEntry } from "@/data/schemas/food-entries";
import { FoodSchema, FoodsSchema, type Food } from "@/data/schemas/foods";
import { HabitEntriesSchema, HabitEntrySchema, type HabitEntry } from "@/data/schemas/habit-entries";
import { HabitSchema, HabitsSchema, type Habit } from "@/data/schemas/habits";
import { WeightEntrySchema, WeightSchema, type WeightEntry } from "@/data/schemas/weight";
import { parseOrThrow } from "@/data/http";

const MEASUREMENTS_URL = "/api/measurements";
const HABITS_URL = "/api/habits";
const HABIT_ENTRIES_URL = "/api/habits/entries";
const FOODS_URL = "/api/foods";
const FOOD_ENTRIES_URL = "/api/food-entries";

type MeasurementInput = {
  date: string;
  kg: number;
};

export async function getMeasurements(): Promise<WeightEntry[]> {
  const response = await fetch(MEASUREMENTS_URL);
  const body = await parseOrThrow(response);
  return WeightSchema.parse(body);
}

export async function createMeasurement(input: MeasurementInput): Promise<WeightEntry> {
  const response = await fetch(MEASUREMENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WeightEntrySchema.parse(body);
}

export async function updateMeasurement(id: string, input: MeasurementInput): Promise<WeightEntry> {
  const response = await fetch(`${MEASUREMENTS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WeightEntrySchema.parse(body);
}

export async function deleteMeasurement(id: string): Promise<void> {
  const response = await fetch(`${MEASUREMENTS_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}

export async function getHabits(): Promise<Habit[]> {
  const response = await fetch(HABITS_URL);
  const body = await parseOrThrow(response);
  return HabitsSchema.parse(body);
}

export async function createHabit(name: string): Promise<Habit> {
  const response = await fetch(HABITS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = await parseOrThrow(response);
  return HabitSchema.parse(body);
}

export async function updateHabit(
  id: string,
  input: { name?: string; active?: boolean },
): Promise<Habit> {
  const response = await fetch(`${HABITS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return HabitSchema.parse(body);
}

export async function reorderHabits(ids: string[]): Promise<void> {
  const response = await fetch(`${HABITS_URL}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  await parseOrThrow(response);
}

export async function getHabitEntries(): Promise<HabitEntry[]> {
  const response = await fetch(HABIT_ENTRIES_URL);
  const body = await parseOrThrow(response);
  return HabitEntriesSchema.parse(body);
}

export async function createHabitEntry(input: {
  habitId: string;
  date: string;
}): Promise<HabitEntry> {
  const response = await fetch(HABIT_ENTRIES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return HabitEntrySchema.parse(body);
}

export async function deleteHabitEntry(id: string): Promise<void> {
  const response = await fetch(`${HABIT_ENTRIES_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
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
  const response = await fetch(FOODS_URL);
  const body = await parseOrThrow(response);
  return FoodsSchema.parse(body);
}

export async function createFood(input: FoodInput): Promise<Food> {
  const response = await fetch(FOODS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return FoodSchema.parse(body);
}

export async function updateFood(id: string, input: Partial<FoodInput>): Promise<Food> {
  const response = await fetch(`${FOODS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return FoodSchema.parse(body);
}

export async function deleteFood(id: string): Promise<void> {
  const response = await fetch(`${FOODS_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}

export async function getFoodEntries(): Promise<FoodEntry[]> {
  const response = await fetch(FOOD_ENTRIES_URL);
  const body = await parseOrThrow(response);
  return FoodEntriesSchema.parse(body);
}

export async function createFoodEntry(input: {
  foodId: string;
  quantity: number;
  date: string;
}): Promise<FoodEntry> {
  const response = await fetch(FOOD_ENTRIES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return FoodEntrySchema.parse(body);
}

export async function updateFoodEntry(id: string, quantity: number): Promise<FoodEntry> {
  const response = await fetch(`${FOOD_ENTRIES_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  const body = await parseOrThrow(response);
  return FoodEntrySchema.parse(body);
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const response = await fetch(`${FOOD_ENTRIES_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}
