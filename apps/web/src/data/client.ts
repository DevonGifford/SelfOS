// Swap seam: every feature hook imports from here, never from ./demo-client,
// ./api-client, or ./guest-client directly. Two independent axes dispatch
// through this one file:
//   - per-domain migration status (build-time: which functions below come
//     from api-client vs demo-client's star-export) — each domain migrates
//     independently, named exports shadow demo-client's star-export for
//     whichever domains have a real backend; everything else still comes
//     from demo data. Once every domain is real, demo-client.ts and this
//     file's star-export can be deleted.
//   - guest mode (runtime, via withGuest below): for a guest session, every
//     domain resolves to guest-client's in-memory fake regardless of its
//     migration status above — see data/guest.ts and data/guest-client.ts.
import * as api from "./api-client";
import * as guestClient from "./guest-client";
import { isGuestSession } from "./guest";

export * from "./demo-client";

// isGuestSession() is checked inside the returned closure, evaluated per
// call — it can't be hoisted, since the flag is set by a click handler
// after this module has already been evaluated.
function withGuest<A extends unknown[], R>(
  real: (...args: A) => Promise<R>,
  fake: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return (...args: A) => (isGuestSession() ? fake(...args) : real(...args));
}

export const getMeasurements = withGuest(api.getMeasurements, guestClient.getMeasurements);
export const createMeasurement = withGuest(api.createMeasurement, guestClient.createMeasurement);
export const updateMeasurement = withGuest(api.updateMeasurement, guestClient.updateMeasurement);
export const deleteMeasurement = withGuest(api.deleteMeasurement, guestClient.deleteMeasurement);

export const getHabits = withGuest(api.getHabits, guestClient.getHabits);
export const createHabit = withGuest(api.createHabit, guestClient.createHabit);
export const updateHabit = withGuest(api.updateHabit, guestClient.updateHabit);
export const reorderHabits = withGuest(api.reorderHabits, guestClient.reorderHabits);
export const getHabitEntries = withGuest(api.getHabitEntries, guestClient.getHabitEntries);
export const createHabitEntry = withGuest(api.createHabitEntry, guestClient.createHabitEntry);
export const deleteHabitEntry = withGuest(api.deleteHabitEntry, guestClient.deleteHabitEntry);

export const getFoods = withGuest(api.getFoods, guestClient.getFoods);
export const createFood = withGuest(api.createFood, guestClient.createFood);
export const updateFood = withGuest(api.updateFood, guestClient.updateFood);
export const deleteFood = withGuest(api.deleteFood, guestClient.deleteFood);
export const getFoodEntries = withGuest(api.getFoodEntries, guestClient.getFoodEntries);
export const createFoodEntry = withGuest(api.createFoodEntry, guestClient.createFoodEntry);
export const updateFoodEntry = withGuest(api.updateFoodEntry, guestClient.updateFoodEntry);
export const deleteFoodEntry = withGuest(api.deleteFoodEntry, guestClient.deleteFoodEntry);

export const getConfiguration = withGuest(api.getConfiguration, guestClient.getConfiguration);
export const updateConfiguration = withGuest(api.updateConfiguration, guestClient.updateConfiguration);

export const getExercises = withGuest(api.getExercises, guestClient.getExercises);
export const createExercise = withGuest(api.createExercise, guestClient.createExercise);
export const getLastSetsForExercise = withGuest(api.getLastSetsForExercise, guestClient.getLastSetsForExercise);

export const getWorkoutTemplates = withGuest(api.getWorkoutTemplates, guestClient.getWorkoutTemplates);
export const getWorkoutTemplateSets = withGuest(api.getWorkoutTemplateSets, guestClient.getWorkoutTemplateSets);
export const archiveWorkoutTemplate = withGuest(api.archiveWorkoutTemplate, guestClient.archiveWorkoutTemplate);
export const restoreWorkoutTemplate = withGuest(api.restoreWorkoutTemplate, guestClient.restoreWorkoutTemplate);
export const setDefaultWorkoutTemplate = withGuest(api.setDefaultWorkoutTemplate, guestClient.setDefaultWorkoutTemplate);

export const getWorkoutSessions = withGuest(api.getWorkoutSessions, guestClient.getWorkoutSessions);
export const getUnfinishedWorkoutSession = withGuest(api.getUnfinishedWorkoutSession, guestClient.getUnfinishedWorkoutSession);
export const getWorkoutSession = withGuest(api.getWorkoutSession, guestClient.getWorkoutSession);
export const createWorkoutSession = withGuest(api.createWorkoutSession, guestClient.createWorkoutSession);
export const updateWorkoutSession = withGuest(api.updateWorkoutSession, guestClient.updateWorkoutSession);
export const finishWorkoutSession = withGuest(api.finishWorkoutSession, guestClient.finishWorkoutSession);
export const cancelWorkoutSession = withGuest(api.cancelWorkoutSession, guestClient.cancelWorkoutSession);
export const updateSourceTemplate = withGuest(api.updateSourceTemplate, guestClient.updateSourceTemplate);
export const saveAsTemplate = withGuest(api.saveAsTemplate, guestClient.saveAsTemplate);

export const getSessionExercises = withGuest(api.getSessionExercises, guestClient.getSessionExercises);
export const addSessionExercise = withGuest(api.addSessionExercise, guestClient.addSessionExercise);
export const reorderSessionExercises = withGuest(api.reorderSessionExercises, guestClient.reorderSessionExercises);
export const updateSessionExerciseNote = withGuest(api.updateSessionExerciseNote, guestClient.updateSessionExerciseNote);
export const replaceSessionExercise = withGuest(api.replaceSessionExercise, guestClient.replaceSessionExercise);
export const removeSessionExercise = withGuest(api.removeSessionExercise, guestClient.removeSessionExercise);
export const getSetsForSessionExercise = withGuest(api.getSetsForSessionExercise, guestClient.getSetsForSessionExercise);

export const createWorkoutSet = withGuest(api.createWorkoutSet, guestClient.createWorkoutSet);
export const updateWorkoutSet = withGuest(api.updateWorkoutSet, guestClient.updateWorkoutSet);
export const deleteWorkoutSet = withGuest(api.deleteWorkoutSet, guestClient.deleteWorkoutSet);

// When a domain's getters move into the block above, remove it from this
// list — TypeScript then rejects every <DemoDataBadge domain="..."/> call
// site still using it.
export const DEMO_DOMAINS = [] as const;
export type DemoDomain = (typeof DEMO_DOMAINS)[number];
