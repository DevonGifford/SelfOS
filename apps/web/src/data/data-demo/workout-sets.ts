import type { WorkoutSets } from "@/data/schemas/workout-sets";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

// The actual logged sets behind data-demo/workout-sessions.ts's three
// finished sessions — adapted from the training-prototype's
// LAST_SESSION_SETS fixture, now keyed by sessionExerciseId rather than
// exerciseId.
export const demoWorkoutSets: WorkoutSets = [
  // sess-push-1 / Bench Press
  { id: "set-1", sessionExerciseId: "se-push-1-bench", setType: "warmup", confirmed: true, note: null, weightKg: 40, reps: 15, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-2", sessionExerciseId: "se-push-1-bench", setType: "working", confirmed: true, note: null, weightKg: 60, reps: 11, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-3", sessionExerciseId: "se-push-1-bench", setType: "working", confirmed: true, note: null, weightKg: 65, reps: 11, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-4", sessionExerciseId: "se-push-1-bench", setType: "working", confirmed: true, note: null, weightKg: 70, reps: 6, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-5", sessionExerciseId: "se-push-1-bench", setType: "failure", confirmed: true, note: null, weightKg: 70, reps: 5, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-6", sessionExerciseId: "se-push-1-bench", setType: "drop", confirmed: true, note: null, weightKg: 45, reps: 8, durationSec: null, distanceM: null, createdAt: daysAgo(3) },

  // sess-push-1 / Overhead Press
  { id: "set-7", sessionExerciseId: "se-push-1-ohp", setType: "working", confirmed: true, note: null, weightKg: 45, reps: 8, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-8", sessionExerciseId: "se-push-1-ohp", setType: "working", confirmed: true, note: null, weightKg: 45, reps: 8, durationSec: null, distanceM: null, createdAt: daysAgo(3) },
  { id: "set-9", sessionExerciseId: "se-push-1-ohp", setType: "working", confirmed: true, note: null, weightKg: 45, reps: 6, durationSec: null, distanceM: null, createdAt: daysAgo(3) },

  // sess-pull-1 / Pull-up
  { id: "set-10", sessionExerciseId: "se-pull-1-pullup", setType: "working", confirmed: true, note: null, weightKg: 0, reps: 12, durationSec: null, distanceM: null, createdAt: daysAgo(5) },
  { id: "set-11", sessionExerciseId: "se-pull-1-pullup", setType: "working", confirmed: true, note: null, weightKg: 0, reps: 10, durationSec: null, distanceM: null, createdAt: daysAgo(5) },

  // sess-cardio-1 / Treadmill Run
  { id: "set-12", sessionExerciseId: "se-cardio-1-treadmill", setType: "working", confirmed: true, note: null, weightKg: null, reps: null, durationSec: 1500, distanceM: 5000, createdAt: daysAgo(2) },
];
