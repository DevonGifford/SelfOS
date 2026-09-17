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

// Widened per ticket 01's amendment: Strong's reference UI treats a drop set
// as just another tag on a set row (not a deeper relational structure), so
// it costs nothing extra to include alongside warmup/failure. Superset stays
// out — that one really is a cross-exercise pairing, not a tag.
export type SetType = "warmup" | "working" | "failure" | "drop";

export const SET_TYPE_BADGE: Record<SetType, string> = {
  warmup: "W",
  working: "",
  failure: "F",
  drop: "D",
};

export const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: "Warm up",
  working: "Working",
  failure: "Failure",
  drop: "Drop set",
};

// Shared between the live set-type badge and the "Previous" column's tag,
// so a past failure set reads with the same red as a current one.
export const SET_TYPE_COLOR: Record<SetType, string> = {
  warmup: "text-amber-500",
  working: "text-foreground",
  failure: "text-red-500",
  drop: "text-violet-400",
};

export type LoggedSet = {
  id: string;
  exerciseId: string;
  setType: SetType;
  confirmed: boolean;
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
// have an entry (a first-ever exercise has nothing to prefill from). Also
// doubles as a Template's suggested starting sets in this prototype, same
// as the real Template snapshot would.
export const LAST_SESSION_SETS: Record<string, LoggedSet[]> = {
  bench: [
    { id: "l1", exerciseId: "bench", setType: "warmup", confirmed: true, weightKg: 40, reps: 15 },
    { id: "l2", exerciseId: "bench", setType: "working", confirmed: true, weightKg: 60, reps: 11 },
    { id: "l3", exerciseId: "bench", setType: "working", confirmed: true, weightKg: 65, reps: 11 },
    { id: "l4", exerciseId: "bench", setType: "working", confirmed: true, weightKg: 70, reps: 6 },
    { id: "l5", exerciseId: "bench", setType: "failure", confirmed: true, weightKg: 70, reps: 5 },
    { id: "l6", exerciseId: "bench", setType: "drop", confirmed: true, weightKg: 45, reps: 8 },
  ],
  ohp: [
    { id: "l7", exerciseId: "ohp", setType: "working", confirmed: true, weightKg: 45, reps: 8 },
    { id: "l8", exerciseId: "ohp", setType: "working", confirmed: true, weightKg: 45, reps: 8 },
    { id: "l9", exerciseId: "ohp", setType: "working", confirmed: true, weightKg: 45, reps: 6 },
  ],
  pullup: [
    { id: "l10", exerciseId: "pullup", setType: "working", confirmed: true, weightKg: 0, reps: 12 },
    { id: "l11", exerciseId: "pullup", setType: "working", confirmed: true, weightKg: 0, reps: 10 },
  ],
  treadmill: [{ id: "l12", exerciseId: "treadmill", setType: "working", confirmed: true, durationSec: 1500, distanceM: 5000 }],
};

// The numeric part only — no [W]/[F]/[D] suffix. Callers that want the
// type called out (e.g. the "Previous" column) render that tag themselves,
// colored via SET_TYPE_COLOR, rather than getting it baked into plain text.
export function formatSetBase(exercise: { type: ExerciseType }, set: LoggedSet): string {
  if (exercise.type === "cardio") {
    const mins = set.durationSec ? Math.round(set.durationSec / 60) : 0;
    const km = set.distanceM ? (set.distanceM / 1000).toFixed(1) : "0.0";
    return `${mins}:00 · ${km}km`;
  }
  return `${set.weightKg ?? 0}kg × ${set.reps ?? 0}`;
}

export function formatSet(exercise: { type: ExerciseType }, set: LoggedSet): string {
  const badge = SET_TYPE_BADGE[set.setType];
  const suffix = badge ? ` [${badge}]` : "";
  return `${formatSetBase(exercise, set)}${suffix}`;
}

export type Scenario = "normal" | "loading" | "error" | "empty";
