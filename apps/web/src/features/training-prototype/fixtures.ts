// PROTOTYPE FIXTURES — throwaway, answers ticket 02 on .scratch/training-feature/map.md.
// Not real schemas. Do not import from real feature code.

export type ExerciseType = "strength" | "cardio";
export type Category = "push" | "pull" | "legs" | "cardio" | "freestyle";

export const CATEGORY_LABEL: Record<Category, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  cardio: "Cardio",
  freestyle: "Freestyle",
};

export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  category: Category;
};

export const EXERCISES: Exercise[] = [
  { id: "bench", name: "Bench Press", type: "strength", category: "push" },
  { id: "ohp", name: "Overhead Press", type: "strength", category: "push" },
  { id: "incline-db", name: "Incline Dumbbell Press", type: "strength", category: "push" },
  { id: "lateral-raise", name: "Lateral Raise", type: "strength", category: "push" },
  { id: "pullup", name: "Pull-up", type: "strength", category: "pull" },
  { id: "row", name: "Barbell Row", type: "strength", category: "pull" },
  { id: "lat-pulldown", name: "Lat Pulldown", type: "strength", category: "pull" },
  { id: "squat", name: "Back Squat", type: "strength", category: "legs" },
  { id: "rdl", name: "Romanian Deadlift", type: "strength", category: "legs" },
  { id: "leg-press", name: "Leg Press", type: "strength", category: "legs" },
  { id: "treadmill", name: "Treadmill Run", type: "cardio", category: "cardio" },
  { id: "row-erg", name: "Row Erg", type: "cardio", category: "cardio" },
];

export type Template = {
  id: string;
  name: string;
  category: Category;
  exerciseIds: string[];
};

export const TEMPLATES: Template[] = [
  { id: "tpl-push", name: "Push Day", category: "push", exerciseIds: ["bench", "ohp", "incline-db", "lateral-raise"] },
  { id: "tpl-pull", name: "Pull Day", category: "pull", exerciseIds: ["pullup", "row", "lat-pulldown"] },
  { id: "tpl-legs", name: "Leg Day", category: "legs", exerciseIds: ["squat", "rdl", "leg-press"] },
];

export type LoggedSet = {
  id: string;
  exerciseId: string;
  isWarmup: boolean;
  note?: string;
  // strength
  weightKg?: number;
  reps?: number;
  // cardio
  durationSec?: number;
  distanceM?: number;
};

// "Last session of the same type" — the progressive-overload prefill the map
// decided on. Keyed by exerciseId; only exercises with a prior logged set
// have an entry (a first-ever exercise has nothing to prefill from).
export const LAST_SESSION_SETS: Record<string, LoggedSet[]> = {
  bench: [
    { id: "l1", exerciseId: "bench", isWarmup: true, weightKg: 40, reps: 10 },
    { id: "l2", exerciseId: "bench", isWarmup: false, weightKg: 80, reps: 8 },
    { id: "l3", exerciseId: "bench", isWarmup: false, weightKg: 80, reps: 7 },
    { id: "l4", exerciseId: "bench", isWarmup: false, weightKg: 80, reps: 6 },
  ],
  ohp: [
    { id: "l5", exerciseId: "ohp", isWarmup: false, weightKg: 45, reps: 8 },
    { id: "l6", exerciseId: "ohp", isWarmup: false, weightKg: 45, reps: 8 },
    { id: "l7", exerciseId: "ohp", isWarmup: false, weightKg: 45, reps: 6 },
  ],
  pullup: [
    { id: "l8", exerciseId: "pullup", isWarmup: false, weightKg: 0, reps: 12 },
    { id: "l9", exerciseId: "pullup", isWarmup: false, weightKg: 0, reps: 10 },
  ],
  treadmill: [{ id: "l10", exerciseId: "treadmill", isWarmup: false, durationSec: 1500, distanceM: 5000 }],
};

export function formatSet(exercise: Exercise, set: LoggedSet): string {
  if (exercise.type === "cardio") {
    const mins = set.durationSec ? Math.round(set.durationSec / 60) : 0;
    const km = set.distanceM ? (set.distanceM / 1000).toFixed(1) : "0.0";
    return `${mins}:00 · ${km}km`;
  }
  return `${set.weightKg ?? 0}kg × ${set.reps ?? 0}`;
}

export type Scenario = "normal" | "loading" | "error" | "empty";
