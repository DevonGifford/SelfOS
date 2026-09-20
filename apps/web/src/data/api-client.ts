import { ConfigurationSchema, type Configuration } from "@/data/schemas/configuration";
import { ExerciseSchema, ExercisesSchema, type Exercise } from "@/data/schemas/exercises";
import {
  FoodEntriesSchema,
  FoodEntrySchema,
  type FoodEntry,
  type MealSlot,
} from "@/data/schemas/food-entries";
import { FoodSchema, FoodsSchema, type Food } from "@/data/schemas/foods";
import { HabitEntriesSchema, HabitEntrySchema, type HabitEntry } from "@/data/schemas/habit-entries";
import { HabitSchema, HabitsSchema, type Habit } from "@/data/schemas/habits";
import type { SessionWorkoutType, WorkoutType } from "@/data/schemas/training-shared";
import { WeightEntrySchema, WeightSchema, type WeightEntry } from "@/data/schemas/weight";
import {
  WorkoutSessionExerciseSchema,
  WorkoutSessionExercisesSchema,
  WorkoutSessionSchema,
  WorkoutSessionsSchema,
  type WorkoutSession,
  type WorkoutSessionExercise,
} from "@/data/schemas/workout-sessions";
import {
  WorkoutSetSchema,
  WorkoutSetsSchema,
  type WorkoutSet,
} from "@/data/schemas/workout-sets";
import {
  WorkoutTemplateSchema,
  WorkoutTemplateSetsSchema,
  WorkoutTemplatesSchema,
  type WorkoutTemplate,
  type WorkoutTemplateSets,
} from "@/data/schemas/workout-templates";
import { parseOrThrow } from "@/data/http";

const MEASUREMENTS_URL = "/api/measurements";
const HABITS_URL = "/api/habits";
const HABIT_ENTRIES_URL = "/api/habits/entries";
const FOODS_URL = "/api/foods";
const FOOD_ENTRIES_URL = "/api/food-entries";
const CONFIGURATION_URL = "/api/configuration";
const EXERCISES_URL = "/api/training/exercises";
const TEMPLATES_URL = "/api/training/templates";
const SESSIONS_URL = "/api/training/sessions";
const SESSION_EXERCISES_URL = "/api/training/session-exercises";
const SETS_URL = "/api/training/sets";

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
  mealSlot: MealSlot;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): Promise<FoodEntry> {
  const response = await fetch(FOOD_ENTRIES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return FoodEntrySchema.parse(body);
}

export async function updateFoodEntry(
  id: string,
  input: {
    quantity: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealSlot?: MealSlot;
  },
): Promise<FoodEntry> {
  const response = await fetch(`${FOOD_ENTRIES_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return FoodEntrySchema.parse(body);
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const response = await fetch(`${FOOD_ENTRIES_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}

export async function getConfiguration(): Promise<Configuration> {
  const response = await fetch(CONFIGURATION_URL);
  const body = await parseOrThrow(response);
  return ConfigurationSchema.parse(body);
}

export async function updateConfiguration(input: Configuration): Promise<Configuration> {
  const response = await fetch(CONFIGURATION_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return ConfigurationSchema.parse(body);
}

// ---- Training: exercises ----

export async function getExercises(): Promise<Exercise[]> {
  const response = await fetch(EXERCISES_URL);
  const body = await parseOrThrow(response);
  return ExercisesSchema.parse(body);
}

export async function createExercise(input: {
  name: string;
  type: "strength" | "cardio";
  workoutType: WorkoutType;
}): Promise<Exercise> {
  const response = await fetch(EXERCISES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return ExerciseSchema.parse(body);
}

// Progressive overload: the most recent Set(s) for this Exercise, from the
// last Session of the given (Session) Workout Type.
export async function getLastSetsForExercise(
  exerciseId: string,
  workoutType: SessionWorkoutType,
): Promise<WorkoutSet[]> {
  const response = await fetch(`${EXERCISES_URL}/${exerciseId}/last?workoutType=${workoutType}`);
  const body = await parseOrThrow(response);
  return WorkoutSetsSchema.parse(body);
}

// ---- Training: workout templates ----

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const response = await fetch(TEMPLATES_URL);
  const body = await parseOrThrow(response);
  return WorkoutTemplatesSchema.parse(body);
}

export async function getWorkoutTemplateSets(templateId: string): Promise<WorkoutTemplateSets> {
  const response = await fetch(`${TEMPLATES_URL}/${templateId}/sets`);
  const body = await parseOrThrow(response);
  return WorkoutTemplateSetsSchema.parse(body);
}

export async function archiveWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const response = await fetch(`${TEMPLATES_URL}/${id}/archive`, { method: "POST" });
  const body = await parseOrThrow(response);
  return WorkoutTemplateSchema.parse(body);
}

export async function restoreWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const response = await fetch(`${TEMPLATES_URL}/${id}/restore`, { method: "POST" });
  const body = await parseOrThrow(response);
  return WorkoutTemplateSchema.parse(body);
}

export async function setDefaultWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const response = await fetch(`${TEMPLATES_URL}/${id}/set-default`, { method: "POST" });
  const body = await parseOrThrow(response);
  return WorkoutTemplateSchema.parse(body);
}

// ---- Training: sessions ----

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  const response = await fetch(SESSIONS_URL);
  const body = await parseOrThrow(response);
  return WorkoutSessionsSchema.parse(body);
}

// null means there's nothing to resume — a real, expected state (204), not
// an error.
export async function getUnfinishedWorkoutSession(): Promise<WorkoutSession | null> {
  const response = await fetch(`${SESSIONS_URL}/unfinished`);
  const body = await parseOrThrow(response);
  if (body === null) return null;
  return WorkoutSessionSchema.parse(body);
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  const response = await fetch(`${SESSIONS_URL}/${id}`);
  const body = await parseOrThrow(response);
  return WorkoutSessionSchema.parse(body);
}

export async function createWorkoutSession(input: {
  workoutType: SessionWorkoutType;
  templateId?: string | null;
}): Promise<WorkoutSession> {
  const response = await fetch(SESSIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WorkoutSessionSchema.parse(body);
}

export async function updateWorkoutSession(
  id: string,
  input: { note?: string; startedAt?: string; finishedAt?: string },
): Promise<WorkoutSession> {
  const response = await fetch(`${SESSIONS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WorkoutSessionSchema.parse(body);
}

export async function finishWorkoutSession(id: string): Promise<WorkoutSession> {
  const response = await fetch(`${SESSIONS_URL}/${id}/finish`, { method: "POST" });
  const body = await parseOrThrow(response);
  return WorkoutSessionSchema.parse(body);
}

// "Cancel Workout" — a hard delete of the whole session and everything
// under it.
export async function cancelWorkoutSession(id: string): Promise<void> {
  const response = await fetch(`${SESSIONS_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}

export async function updateSourceTemplate(sessionId: string): Promise<WorkoutTemplate> {
  const response = await fetch(`${SESSIONS_URL}/${sessionId}/update-source-template`, { method: "POST" });
  const body = await parseOrThrow(response);
  return WorkoutTemplateSchema.parse(body);
}

export async function saveAsTemplate(
  sessionId: string,
  input: { workoutType: WorkoutType; name: string },
): Promise<WorkoutTemplate> {
  const response = await fetch(`${SESSIONS_URL}/${sessionId}/save-as-template`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WorkoutTemplateSchema.parse(body);
}

// ---- Training: session exercises ----

export async function getSessionExercises(sessionId: string): Promise<WorkoutSessionExercise[]> {
  const response = await fetch(`${SESSIONS_URL}/${sessionId}/exercises`);
  const body = await parseOrThrow(response);
  return WorkoutSessionExercisesSchema.parse(body);
}

export async function addSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<WorkoutSessionExercise> {
  const response = await fetch(`${SESSIONS_URL}/${sessionId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  });
  const body = await parseOrThrow(response);
  return WorkoutSessionExerciseSchema.parse(body);
}

// Full new order — mirrors reorderHabits' shape exactly.
export async function reorderSessionExercises(sessionId: string, ids: string[]): Promise<void> {
  const response = await fetch(`${SESSIONS_URL}/${sessionId}/exercises/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  await parseOrThrow(response);
}

export async function updateSessionExerciseNote(
  id: string,
  note: string,
): Promise<WorkoutSessionExercise> {
  const response = await fetch(`${SESSION_EXERCISES_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  const body = await parseOrThrow(response);
  return WorkoutSessionExerciseSchema.parse(body);
}

// Swaps the Exercise at this slot in place — drops its already-logged Sets
// (they were logged against a different Exercise).
export async function replaceSessionExercise(
  id: string,
  exerciseId: string,
): Promise<WorkoutSessionExercise> {
  const response = await fetch(`${SESSION_EXERCISES_URL}/${id}/replace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  });
  const body = await parseOrThrow(response);
  return WorkoutSessionExerciseSchema.parse(body);
}

export async function removeSessionExercise(id: string): Promise<void> {
  const response = await fetch(`${SESSION_EXERCISES_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}

export async function getSetsForSessionExercise(sessionExerciseId: string): Promise<WorkoutSet[]> {
  const response = await fetch(`${SESSION_EXERCISES_URL}/${sessionExerciseId}/sets`);
  const body = await parseOrThrow(response);
  return WorkoutSetsSchema.parse(body);
}

// ---- Training: sets ----

type WorkoutSetInput = {
  sessionExerciseId: string;
  setType: "warmup" | "working" | "failure" | "drop";
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
  note?: string | null;
};

export async function createWorkoutSet(input: WorkoutSetInput): Promise<WorkoutSet> {
  const response = await fetch(SETS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WorkoutSetSchema.parse(body);
}

export async function updateWorkoutSet(
  id: string,
  input: Partial<Omit<WorkoutSetInput, "sessionExerciseId">> & { confirmed?: boolean },
): Promise<WorkoutSet> {
  const response = await fetch(`${SETS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WorkoutSetSchema.parse(body);
}

export async function deleteWorkoutSet(id: string): Promise<void> {
  const response = await fetch(`${SETS_URL}/${id}`, { method: "DELETE" });
  await parseOrThrow(response);
}
