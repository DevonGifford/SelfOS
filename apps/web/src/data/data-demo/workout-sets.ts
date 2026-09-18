// Sessions and their Sets are built together in data-demo/workout-sessions.ts
// (a Set can't be authored without the sessionExerciseId that builder
// assigns) — re-exported here so guest-client.ts can still import Sets by
// their own resource file, matching every other domain's convention.
export { demoWorkoutSets } from "@/data/data-demo/workout-sessions";
