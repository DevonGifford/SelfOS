import { HabitEntriesSchema, HabitEntrySchema, type HabitEntry } from "@/data/schemas/habit-entries";
import { HabitSchema, HabitsSchema, type Habit } from "@/data/schemas/habits";
import { WeightEntrySchema, WeightSchema, type WeightEntry } from "@/data/schemas/weight";
import { parseOrThrow } from "@/data/http";

const MEASUREMENTS_URL = "/api/measurements";
const HABITS_URL = "/api/habits";
const HABIT_ENTRIES_URL = "/api/habits/entries";

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
