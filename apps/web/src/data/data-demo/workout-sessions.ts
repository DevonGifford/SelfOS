import type { WorkoutSessionExercises, WorkoutSessions } from "@/data/schemas/workout-sessions";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

function dateDaysAgo(days: number): string {
  return daysAgo(days).slice(0, 10);
}

// Three finished sessions — one each for Push/Pull/Cardio — so a fresh
// guest session has real "last time" data to prefill from (progressive
// overload) without needing to log a full history first. No Legs session
// on purpose: exercises the "first time logging this Exercise" empty state
// too.
export const demoWorkoutSessions: WorkoutSessions = [
  {
    id: "sess-push-1",
    workoutType: "push",
    templateId: "tpl-push-day",
    note: null,
    date: dateDaysAgo(3),
    finishedAt: daysAgo(3),
    createdAt: daysAgo(3),
  },
  {
    id: "sess-pull-1",
    workoutType: "pull",
    templateId: "tpl-pull-day",
    note: null,
    date: dateDaysAgo(5),
    finishedAt: daysAgo(5),
    createdAt: daysAgo(5),
  },
  {
    id: "sess-cardio-1",
    workoutType: "cardio",
    templateId: "tpl-cardio-day",
    note: "Easy pace, felt good",
    date: dateDaysAgo(2),
    finishedAt: daysAgo(2),
    createdAt: daysAgo(2),
  },
];

export const demoWorkoutSessionExercises: WorkoutSessionExercises = [
  { id: "se-push-1-bench", sessionId: "sess-push-1", exerciseId: "ex-bench", exerciseName: "Bench Press", note: null, position: 0 },
  { id: "se-push-1-ohp", sessionId: "sess-push-1", exerciseId: "ex-ohp", exerciseName: "Overhead Press", note: null, position: 1 },

  { id: "se-pull-1-pullup", sessionId: "sess-pull-1", exerciseId: "ex-pullup", exerciseName: "Pull-up", note: null, position: 0 },

  { id: "se-cardio-1-treadmill", sessionId: "sess-cardio-1", exerciseId: "ex-treadmill", exerciseName: "Treadmill Run", note: null, position: 0 },
];
