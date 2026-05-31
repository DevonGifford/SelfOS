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

// When a domain's getters move into the block above, remove it from this
// list — TypeScript then rejects every <DemoDataBadge domain="..."/> call
// site still using it.
export const DEMO_DOMAINS = ["training"] as const;
export type DemoDomain = (typeof DEMO_DOMAINS)[number];
