import type { Exercises } from "@/data/schemas/exercises";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

// Adapted from the training-prototype's own fixtures.ts (branch
// prototype/training-log-ui) — same exercise set, now shaped to the real
// Exercise schema.
export const demoExercises: Exercises = [
  { id: "ex-bench", name: "Bench Press", type: "strength", workoutType: "push", createdAt: daysAgo(90) },
  { id: "ex-ohp", name: "Overhead Press", type: "strength", workoutType: "push", createdAt: daysAgo(90) },
  { id: "ex-incline-db", name: "Incline Dumbbell Press", type: "strength", workoutType: "push", createdAt: daysAgo(90) },
  { id: "ex-lateral-raise", name: "Lateral Raise", type: "strength", workoutType: "push", createdAt: daysAgo(90) },
  { id: "ex-dips", name: "Dips", type: "strength", workoutType: "push", createdAt: daysAgo(90) },
  { id: "ex-pullup", name: "Pull-up", type: "strength", workoutType: "pull", createdAt: daysAgo(90) },
  { id: "ex-row", name: "Barbell Row", type: "strength", workoutType: "pull", createdAt: daysAgo(90) },
  { id: "ex-lat-pulldown", name: "Lat Pulldown", type: "strength", workoutType: "pull", createdAt: daysAgo(90) },
  { id: "ex-squat", name: "Back Squat", type: "strength", workoutType: "legs", createdAt: daysAgo(90) },
  { id: "ex-rdl", name: "Romanian Deadlift", type: "strength", workoutType: "legs", createdAt: daysAgo(90) },
  { id: "ex-leg-press", name: "Leg Press", type: "strength", workoutType: "legs", createdAt: daysAgo(90) },
  { id: "ex-treadmill", name: "Treadmill Run", type: "cardio", workoutType: "cardio", createdAt: daysAgo(90) },
  { id: "ex-row-erg", name: "Row Erg", type: "cardio", workoutType: "cardio", createdAt: daysAgo(90) },
];
