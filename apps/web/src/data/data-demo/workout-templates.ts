import type { WorkoutTemplates, WorkoutTemplateSets } from "@/data/schemas/workout-templates";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

// Adapted from the training-prototype's INITIAL_TEMPLATES — Push gets a
// default + 2 alternates, Pull gets a default + 1 alternate, Legs/Cardio
// just a default each, matching ticket 04's worked example.
export const demoWorkoutTemplates: WorkoutTemplates = [
  { id: "tpl-push-day", name: "Push Day", workoutType: "push", isDefault: true, archived: false, createdAt: daysAgo(90) },
  { id: "tpl-push-heavy", name: "Push Heavy", workoutType: "push", isDefault: false, archived: false, createdAt: daysAgo(60) },
  { id: "tpl-push-light", name: "Push Light", workoutType: "push", isDefault: false, archived: false, createdAt: daysAgo(60) },
  { id: "tpl-pull-day", name: "Pull Day", workoutType: "pull", isDefault: true, archived: false, createdAt: daysAgo(90) },
  { id: "tpl-pull-heavy", name: "Pull Heavy", workoutType: "pull", isDefault: false, archived: false, createdAt: daysAgo(60) },
  { id: "tpl-legs-day", name: "Leg Day", workoutType: "legs", isDefault: true, archived: false, createdAt: daysAgo(90) },
  { id: "tpl-cardio-day", name: "Cardio Day", workoutType: "cardio", isDefault: true, archived: false, createdAt: daysAgo(90) },
];

// Each template's suggested sets — flattened, position-ordered, grouped by
// consecutive exerciseId (matches how the real API's seedSessionFromTemplate
// groups workout_template_sets rows back into session-exercises).
export const demoWorkoutTemplateSets: WorkoutTemplateSets = [
  // Push Day: bench, ohp, incline-db, lateral-raise
  { id: "tpls-1", templateId: "tpl-push-day", exerciseId: "ex-bench", exerciseName: "Bench Press", position: 0, setType: "warmup", weightKg: 40, reps: 15, durationSec: null, distanceM: null },
  { id: "tpls-2", templateId: "tpl-push-day", exerciseId: "ex-bench", exerciseName: "Bench Press", position: 1, setType: "working", weightKg: 60, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-3", templateId: "tpl-push-day", exerciseId: "ex-bench", exerciseName: "Bench Press", position: 2, setType: "working", weightKg: 65, reps: 8, durationSec: null, distanceM: null },
  { id: "tpls-4", templateId: "tpl-push-day", exerciseId: "ex-ohp", exerciseName: "Overhead Press", position: 3, setType: "working", weightKg: 45, reps: 8, durationSec: null, distanceM: null },
  { id: "tpls-5", templateId: "tpl-push-day", exerciseId: "ex-ohp", exerciseName: "Overhead Press", position: 4, setType: "working", weightKg: 45, reps: 8, durationSec: null, distanceM: null },
  { id: "tpls-6", templateId: "tpl-push-day", exerciseId: "ex-incline-db", exerciseName: "Incline Dumbbell Press", position: 5, setType: "working", weightKg: 24, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-7", templateId: "tpl-push-day", exerciseId: "ex-lateral-raise", exerciseName: "Lateral Raise", position: 6, setType: "working", weightKg: 10, reps: 12, durationSec: null, distanceM: null },

  // Push Heavy: bench, ohp, dips
  { id: "tpls-8", templateId: "tpl-push-heavy", exerciseId: "ex-bench", exerciseName: "Bench Press", position: 0, setType: "working", weightKg: 75, reps: 5, durationSec: null, distanceM: null },
  { id: "tpls-9", templateId: "tpl-push-heavy", exerciseId: "ex-ohp", exerciseName: "Overhead Press", position: 1, setType: "working", weightKg: 50, reps: 5, durationSec: null, distanceM: null },
  { id: "tpls-10", templateId: "tpl-push-heavy", exerciseId: "ex-dips", exerciseName: "Dips", position: 2, setType: "working", weightKg: 10, reps: 8, durationSec: null, distanceM: null },

  // Push Light: incline-db, lateral-raise, dips
  { id: "tpls-11", templateId: "tpl-push-light", exerciseId: "ex-incline-db", exerciseName: "Incline Dumbbell Press", position: 0, setType: "working", weightKg: 18, reps: 12, durationSec: null, distanceM: null },
  { id: "tpls-12", templateId: "tpl-push-light", exerciseId: "ex-lateral-raise", exerciseName: "Lateral Raise", position: 1, setType: "working", weightKg: 8, reps: 15, durationSec: null, distanceM: null },
  { id: "tpls-13", templateId: "tpl-push-light", exerciseId: "ex-dips", exerciseName: "Dips", position: 2, setType: "working", weightKg: 0, reps: 12, durationSec: null, distanceM: null },

  // Pull Day: pullup, row, lat-pulldown
  { id: "tpls-14", templateId: "tpl-pull-day", exerciseId: "ex-pullup", exerciseName: "Pull-up", position: 0, setType: "working", weightKg: 0, reps: 12, durationSec: null, distanceM: null },
  { id: "tpls-15", templateId: "tpl-pull-day", exerciseId: "ex-pullup", exerciseName: "Pull-up", position: 1, setType: "working", weightKg: 0, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-16", templateId: "tpl-pull-day", exerciseId: "ex-row", exerciseName: "Barbell Row", position: 2, setType: "working", weightKg: 55, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-17", templateId: "tpl-pull-day", exerciseId: "ex-lat-pulldown", exerciseName: "Lat Pulldown", position: 3, setType: "working", weightKg: 50, reps: 10, durationSec: null, distanceM: null },

  // Pull Heavy: row, pullup
  { id: "tpls-18", templateId: "tpl-pull-heavy", exerciseId: "ex-row", exerciseName: "Barbell Row", position: 0, setType: "working", weightKg: 70, reps: 5, durationSec: null, distanceM: null },
  { id: "tpls-19", templateId: "tpl-pull-heavy", exerciseId: "ex-pullup", exerciseName: "Pull-up", position: 1, setType: "working", weightKg: 10, reps: 6, durationSec: null, distanceM: null },

  // Leg Day: squat, rdl, leg-press
  { id: "tpls-20", templateId: "tpl-legs-day", exerciseId: "ex-squat", exerciseName: "Back Squat", position: 0, setType: "warmup", weightKg: 60, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-21", templateId: "tpl-legs-day", exerciseId: "ex-squat", exerciseName: "Back Squat", position: 1, setType: "working", weightKg: 90, reps: 8, durationSec: null, distanceM: null },
  { id: "tpls-22", templateId: "tpl-legs-day", exerciseId: "ex-rdl", exerciseName: "Romanian Deadlift", position: 2, setType: "working", weightKg: 70, reps: 10, durationSec: null, distanceM: null },
  { id: "tpls-23", templateId: "tpl-legs-day", exerciseId: "ex-leg-press", exerciseName: "Leg Press", position: 3, setType: "working", weightKg: 140, reps: 10, durationSec: null, distanceM: null },

  // Cardio Day: treadmill, row-erg
  { id: "tpls-24", templateId: "tpl-cardio-day", exerciseId: "ex-treadmill", exerciseName: "Treadmill Run", position: 0, setType: "working", weightKg: null, reps: null, durationSec: 1500, distanceM: 5000 },
  { id: "tpls-25", templateId: "tpl-cardio-day", exerciseId: "ex-row-erg", exerciseName: "Row Erg", position: 1, setType: "working", weightKg: null, reps: null, durationSec: 900, distanceM: 2000 },
];
