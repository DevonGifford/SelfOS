import { demoConfiguration } from "@/data/data-demo/configuration";
import { demoExercises } from "@/data/data-demo/exercises";
import { demoFoodEntries } from "@/data/data-demo/food-entries";
import { demoFoods } from "@/data/data-demo/foods";
import { demoHabitEntries } from "@/data/data-demo/habit-entries";
import { demoHabits } from "@/data/data-demo/habits";
import { demoWeight } from "@/data/data-demo/weight";
import {
  demoWorkoutSessionExercises,
  demoWorkoutSessions,
} from "@/data/data-demo/workout-sessions";
import { demoWorkoutSets } from "@/data/data-demo/workout-sets";
import {
  demoWorkoutTemplates,
  demoWorkoutTemplateSets,
} from "@/data/data-demo/workout-templates";
import type { Configuration } from "@/data/schemas/configuration";
import type { Exercise } from "@/data/schemas/exercises";
import type { FoodEntry, MealSlot } from "@/data/schemas/food-entries";
import type { Food } from "@/data/schemas/foods";
import type { HabitEntry } from "@/data/schemas/habit-entries";
import type { Habit } from "@/data/schemas/habits";
import type { SessionWorkoutType, WorkoutType } from "@/data/schemas/training-shared";
import type { WeightEntry } from "@/data/schemas/weight";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/data/schemas/workout-sessions";
import type { WorkoutSet } from "@/data/schemas/workout-sets";
import type {
  WorkoutTemplate,
  WorkoutTemplateSet,
  WorkoutTemplateSets,
} from "@/data/schemas/workout-templates";

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
let configuration: Configuration = { ...demoConfiguration };
let exercises: Exercise[] = [...demoExercises];
let templates: WorkoutTemplate[] = [...demoWorkoutTemplates];
let templateSets: WorkoutTemplateSet[] = [...demoWorkoutTemplateSets];
let sessions: WorkoutSession[] = [...demoWorkoutSessions];
let sessionExercises: WorkoutSessionExercise[] = [...demoWorkoutSessionExercises];
let sets: WorkoutSet[] = [...demoWorkoutSets];

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
  mealSlot: MealSlot;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): Promise<FoodEntry> {
  const food = foods.find((f) => f.id === input.foodId);
  if (!food) throw new Error(`guest-client: unknown food ${input.foodId}`);

  const hasOverrides =
    input.calories !== undefined &&
    input.protein !== undefined &&
    input.carbs !== undefined &&
    input.fat !== undefined;

  const created: FoodEntry = {
    id: guestId(),
    foodId: food.id,
    name: food.name,
    quantity: input.quantity,
    calories: hasOverrides ? input.calories! : Math.round(food.caloriesPerServing * input.quantity),
    protein: hasOverrides ? input.protein! : Math.round(food.proteinPerServing * input.quantity),
    carbs: hasOverrides ? input.carbs! : Math.round(food.carbsPerServing * input.quantity),
    fat: hasOverrides ? input.fat! : Math.round(food.fatPerServing * input.quantity),
    date: input.date,
    createdAt: new Date().toISOString(),
    mealSlot: input.mealSlot,
  };
  foodEntries = [...foodEntries, created];
  return created;
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
  const existing = foodEntries.find((e) => e.id === id);
  if (!existing) throw new Error(`guest-client: unknown food entry ${id}`);

  const mealSlot = input.mealSlot ?? existing.mealSlot;

  // Manual overrides supplied (all four) — use them directly, no Food
  // lookup needed, matching the real API's behavior.
  if (
    input.calories !== undefined &&
    input.protein !== undefined &&
    input.carbs !== undefined &&
    input.fat !== undefined
  ) {
    const updated: FoodEntry = {
      ...existing,
      quantity: input.quantity,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      mealSlot,
    };
    foodEntries = foodEntries.map((e) => (e.id === id ? updated : e));
    return updated;
  }

  const food = existing.foodId ? foods.find((f) => f.id === existing.foodId) : undefined;
  const updated: FoodEntry = food
    ? {
        ...existing,
        quantity: input.quantity,
        calories: Math.round(food.caloriesPerServing * input.quantity),
        protein: Math.round(food.proteinPerServing * input.quantity),
        carbs: Math.round(food.carbsPerServing * input.quantity),
        fat: Math.round(food.fatPerServing * input.quantity),
        mealSlot,
      }
    : { ...existing, quantity: input.quantity, mealSlot };

  foodEntries = foodEntries.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  foodEntries = foodEntries.filter((e) => e.id !== id);
}

export async function getConfiguration(): Promise<Configuration> {
  return { ...configuration };
}

export async function updateConfiguration(input: Configuration): Promise<Configuration> {
  configuration = { ...input };
  return { ...configuration };
}

// ---- Training: exercises ----

export async function getExercises(): Promise<Exercise[]> {
  return [...exercises];
}

export async function createExercise(input: {
  name: string;
  type: "strength" | "cardio";
  workoutType: WorkoutType;
}): Promise<Exercise> {
  const created: Exercise = { id: guestId(), ...input, createdAt: new Date().toISOString() };
  exercises = [...exercises, created];
  return created;
}

// Mirrors GetLastSessionExerciseForType: the most recent finished Session
// of this Workout Type that logged this Exercise, ordered by session date
// (then createdAt) descending.
export async function getLastSetsForExercise(
  exerciseId: string,
  workoutType: SessionWorkoutType,
): Promise<WorkoutSet[]> {
  const candidates = sessionExercises
    .filter((se) => se.exerciseId === exerciseId)
    .map((se) => {
      const session = sessions.find((s) => s.id === se.sessionId);
      return session && session.workoutType === workoutType && session.finishedAt !== null
        ? { se, session }
        : undefined;
    })
    .filter((entry): entry is { se: WorkoutSessionExercise; session: WorkoutSession } => entry !== undefined)
    .sort((a, b) => {
      const byDate = b.session.date.localeCompare(a.session.date);
      return byDate !== 0 ? byDate : b.session.createdAt.localeCompare(a.session.createdAt);
    });

  const match = candidates[0];
  if (!match) return [];
  return sets.filter((s) => s.sessionExerciseId === match.se.id);
}

// ---- Training: workout templates ----

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  return [...templates];
}

export async function getWorkoutTemplateSets(templateId: string): Promise<WorkoutTemplateSets> {
  return templateSets.filter((s) => s.templateId === templateId);
}

// The current default of a Workout Type can't be archived until another
// becomes default first — mirrors the real API's guard.
export async function archiveWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const existing = templates.find((t) => t.id === id);
  if (!existing) throw new Error(`guest-client: unknown template ${id}`);
  if (existing.isDefault) {
    throw new Error("pick a new default for this Workout Type before archiving it");
  }

  const updated: WorkoutTemplate = { ...existing, archived: true };
  templates = templates.map((t) => (t.id === id ? updated : t));
  return updated;
}

export async function restoreWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const existing = templates.find((t) => t.id === id);
  if (!existing) throw new Error(`guest-client: unknown template ${id}`);

  const updated: WorkoutTemplate = { ...existing, archived: false };
  templates = templates.map((t) => (t.id === id ? updated : t));
  return updated;
}

export async function setDefaultWorkoutTemplate(id: string): Promise<WorkoutTemplate> {
  const target = templates.find((t) => t.id === id);
  if (!target) throw new Error(`guest-client: unknown template ${id}`);

  templates = templates.map((t) => {
    if (t.id === id) return { ...t, isDefault: true };
    if (t.workoutType === target.workoutType) return { ...t, isDefault: false };
    return t;
  });
  return templates.find((t) => t.id === id)!;
}

// ---- Training: sessions ----

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  return [...sessions];
}

export async function getUnfinishedWorkoutSession(): Promise<WorkoutSession | null> {
  return sessions.find((s) => s.finishedAt === null) ?? null;
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  const existing = sessions.find((s) => s.id === id);
  if (!existing) throw new Error(`guest-client: unknown session ${id}`);
  return existing;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createWorkoutSession(input: {
  workoutType: SessionWorkoutType;
  templateId?: string | null;
}): Promise<WorkoutSession> {
  const created: WorkoutSession = {
    id: guestId(),
    workoutType: input.workoutType,
    templateId: input.templateId ?? null,
    note: null,
    date: todayDate(),
    finishedAt: null,
    createdAt: new Date().toISOString(),
  };
  sessions = [...sessions, created];

  if (input.templateId) {
    seedSessionFromTemplate(created.id, input.templateId);
  }

  return created;
}

// Groups a Template's flat, position-ordered suggested sets back into
// Session-exercises — consecutive rows sharing the same exercise become one
// session-exercise, mirroring seedSessionFromTemplate's grouping.
function seedSessionFromTemplate(sessionId: string, templateId: string): void {
  const rows = templateSets
    .filter((s) => s.templateId === templateId)
    .sort((a, b) => a.position - b.position);

  let currentSessionExerciseId: string | null = null;
  let currentExerciseId: string | null = null;
  let currentExerciseName = "";
  let position = 0;

  for (const row of rows) {
    const sameGroup =
      currentSessionExerciseId !== null &&
      row.exerciseId === currentExerciseId &&
      row.exerciseName === currentExerciseName;

    if (!sameGroup) {
      const se: WorkoutSessionExercise = {
        id: guestId(),
        sessionId,
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        note: null,
        position: position++,
      };
      sessionExercises = [...sessionExercises, se];
      currentSessionExerciseId = se.id;
      currentExerciseId = row.exerciseId;
      currentExerciseName = row.exerciseName;
    }

    const set: WorkoutSet = {
      id: guestId(),
      sessionExerciseId: currentSessionExerciseId!,
      setType: row.setType,
      confirmed: false,
      note: null,
      weightKg: row.weightKg,
      reps: row.reps,
      durationSec: row.durationSec,
      distanceM: row.distanceM,
      createdAt: new Date().toISOString(),
    };
    sets = [...sets, set];
  }
}

export async function updateWorkoutSession(
  id: string,
  input: { note?: string; startedAt?: string; finishedAt?: string },
): Promise<WorkoutSession> {
  const existing = sessions.find((s) => s.id === id);
  if (!existing) throw new Error(`guest-client: unknown session ${id}`);

  const updated: WorkoutSession = {
    ...existing,
    note: input.note ?? existing.note,
    createdAt: input.startedAt ?? existing.createdAt,
    finishedAt: input.finishedAt ?? existing.finishedAt,
  };
  sessions = sessions.map((s) => (s.id === id ? updated : s));
  return updated;
}

export async function finishWorkoutSession(id: string): Promise<WorkoutSession> {
  const existing = sessions.find((s) => s.id === id);
  if (!existing) throw new Error(`guest-client: unknown session ${id}`);

  const updated: WorkoutSession = { ...existing, finishedAt: new Date().toISOString() };
  sessions = sessions.map((s) => (s.id === id ? updated : s));
  return updated;
}

export async function cancelWorkoutSession(id: string): Promise<void> {
  const doomedExerciseIds = sessionExercises.filter((se) => se.sessionId === id).map((se) => se.id);
  sets = sets.filter((s) => !doomedExerciseIds.includes(s.sessionExerciseId));
  sessionExercises = sessionExercises.filter((se) => se.sessionId !== id);
  sessions = sessions.filter((s) => s.id !== id);
}

// This Session's current exercises/sets, in position order, flattened back
// to the same shape a Template's suggested sets use — shared by
// updateSourceTemplate and saveAsTemplate, mirroring the real API's
// snapshotSession/writeTemplateSets pair.
function snapshotSession(sessionId: string): Omit<WorkoutTemplateSet, "id" | "templateId">[] {
  const exercisesInSession = sessionExercises
    .filter((se) => se.sessionId === sessionId)
    .sort((a, b) => a.position - b.position);

  const snapshot: Omit<WorkoutTemplateSet, "id" | "templateId">[] = [];
  let position = 0;
  for (const se of exercisesInSession) {
    const exerciseSets = sets.filter((s) => s.sessionExerciseId === se.id);
    for (const set of exerciseSets) {
      snapshot.push({
        exerciseId: se.exerciseId,
        exerciseName: se.exerciseName,
        position: position++,
        setType: set.setType,
        weightKg: set.weightKg,
        reps: set.reps,
        durationSec: set.durationSec,
        distanceM: set.distanceM,
      });
    }
  }
  return snapshot;
}

export async function updateSourceTemplate(sessionId: string): Promise<WorkoutTemplate> {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error(`guest-client: unknown session ${sessionId}`);
  if (!session.templateId) throw new Error("this session didn't start from a template");

  const snapshot = snapshotSession(sessionId);
  templateSets = templateSets.filter((s) => s.templateId !== session.templateId);
  templateSets = [
    ...templateSets,
    ...snapshot.map((s) => ({ id: guestId(), templateId: session.templateId!, ...s })),
  ];

  const template = templates.find((t) => t.id === session.templateId);
  if (!template) throw new Error(`guest-client: unknown template ${session.templateId}`);
  return template;
}

export async function saveAsTemplate(
  sessionId: string,
  input: { workoutType: WorkoutType; name: string },
): Promise<WorkoutTemplate> {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error(`guest-client: unknown session ${sessionId}`);

  const duplicate = templates.some(
    (t) => t.workoutType === input.workoutType && t.name === input.name,
  );
  if (duplicate) {
    throw new Error("a template with this name already exists for this Workout Type");
  }

  const created: WorkoutTemplate = {
    id: guestId(),
    name: input.name,
    workoutType: input.workoutType,
    isDefault: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  templates = [...templates, created];

  const snapshot = snapshotSession(sessionId);
  templateSets = [
    ...templateSets,
    ...snapshot.map((s) => ({ id: guestId(), templateId: created.id, ...s })),
  ];

  return created;
}

// ---- Training: session exercises ----

export async function getSessionExercises(sessionId: string): Promise<WorkoutSessionExercise[]> {
  return sessionExercises
    .filter((se) => se.sessionId === sessionId)
    .sort((a, b) => a.position - b.position);
}

export async function addSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<WorkoutSessionExercise> {
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`guest-client: unknown exercise ${exerciseId}`);

  const position = sessionExercises.filter((se) => se.sessionId === sessionId).length;
  const created: WorkoutSessionExercise = {
    id: guestId(),
    sessionId,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    note: null,
    position,
  };
  sessionExercises = [...sessionExercises, created];
  return created;
}

export async function reorderSessionExercises(sessionId: string, ids: string[]): Promise<void> {
  const byId = new Map(sessionExercises.map((se) => [se.id, se]));
  const reordered = ids
    .map((id, index) => {
      const se = byId.get(id);
      return se ? { ...se, position: index } : undefined;
    })
    .filter((se): se is WorkoutSessionExercise => se !== undefined);
  const reorderedIds = new Set(ids);

  sessionExercises = [
    ...sessionExercises.filter((se) => se.sessionId !== sessionId || !reorderedIds.has(se.id)),
    ...reordered,
  ];
}

export async function updateSessionExerciseNote(
  id: string,
  note: string,
): Promise<WorkoutSessionExercise> {
  const existing = sessionExercises.find((se) => se.id === id);
  if (!existing) throw new Error(`guest-client: unknown session exercise ${id}`);

  const updated: WorkoutSessionExercise = { ...existing, note };
  sessionExercises = sessionExercises.map((se) => (se.id === id ? updated : se));
  return updated;
}

export async function replaceSessionExercise(
  id: string,
  exerciseId: string,
): Promise<WorkoutSessionExercise> {
  const existing = sessionExercises.find((se) => se.id === id);
  if (!existing) throw new Error(`guest-client: unknown session exercise ${id}`);

  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`guest-client: unknown exercise ${exerciseId}`);

  sets = sets.filter((s) => s.sessionExerciseId !== id);

  const updated: WorkoutSessionExercise = {
    ...existing,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
  };
  sessionExercises = sessionExercises.map((se) => (se.id === id ? updated : se));
  return updated;
}

export async function removeSessionExercise(id: string): Promise<void> {
  sets = sets.filter((s) => s.sessionExerciseId !== id);
  sessionExercises = sessionExercises.filter((se) => se.id !== id);
}

export async function getSetsForSessionExercise(sessionExerciseId: string): Promise<WorkoutSet[]> {
  return sets.filter((s) => s.sessionExerciseId === sessionExerciseId);
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

// Matches the real API: every newly created set — freshly typed or
// template-seeded — starts unconfirmed until the user taps to confirm it.
export async function createWorkoutSet(input: WorkoutSetInput): Promise<WorkoutSet> {
  const created: WorkoutSet = {
    id: guestId(),
    sessionExerciseId: input.sessionExerciseId,
    setType: input.setType,
    confirmed: false,
    note: input.note ?? null,
    weightKg: input.weightKg ?? null,
    reps: input.reps ?? null,
    durationSec: input.durationSec ?? null,
    distanceM: input.distanceM ?? null,
    createdAt: new Date().toISOString(),
  };
  sets = [...sets, created];
  return created;
}

export async function updateWorkoutSet(
  id: string,
  input: Partial<Omit<WorkoutSetInput, "sessionExerciseId">> & { confirmed?: boolean },
): Promise<WorkoutSet> {
  const existing = sets.find((s) => s.id === id);
  if (!existing) throw new Error(`guest-client: unknown set ${id}`);

  // Mirrors the real API's coalesce semantics: an omitted (undefined) field
  // keeps its existing value rather than being written over it. The real
  // client sends this through JSON.stringify, which drops undefined keys
  // entirely — this has to do the same before spreading.
  const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  const updated: WorkoutSet = { ...existing, ...patch };
  sets = sets.map((s) => (s.id === id ? updated : s));
  return updated;
}

export async function deleteWorkoutSet(id: string): Promise<void> {
  sets = sets.filter((s) => s.id !== id);
}
