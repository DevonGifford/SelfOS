import type { ExerciseType, SetType } from "@/data/schemas/training-shared";

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

export function formatSetBase(
  exerciseType: ExerciseType,
  set: { weightKg: number | null; reps: number | null; durationSec: number | null; distanceM: number | null },
): string {
  if (exerciseType === "cardio") {
    const mins = set.durationSec ? Math.round(set.durationSec / 60) : 0;
    const km = set.distanceM ? (set.distanceM / 1000).toFixed(1) : "0.0";
    return `${mins}:00 · ${km}km`;
  }
  return `${set.weightKg ?? 0}kg × ${set.reps ?? 0}`;
}
