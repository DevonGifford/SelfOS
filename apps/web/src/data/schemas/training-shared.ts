import { z } from "zod";

// Shared across every Training schema file — kept in one place since,
// unlike Habits/Foods, this domain has real cross-resource enums
// (CONTEXT.md's Workout Type / Workout Set entries).

export const ExerciseTypeSchema = z.enum(["strength", "cardio"]);

// The 4 real Workout Types — Exercises and Workout Templates only ever
// carry one of these (ticket 01's amendment: no Exercise or Template is
// inherently "Freestyle").
export const WorkoutTypeSchema = z.enum(["push", "pull", "legs", "cardio"]);

// A Workout Session's own type — the 4 real types plus Freestyle, which
// exists only here, so a Freestyle session stays out of Push/Pull/Legs/
// Cardio's progression lookups by construction.
export const SessionWorkoutTypeSchema = z.enum(["push", "pull", "legs", "cardio", "freestyle"]);

export const SetTypeSchema = z.enum(["warmup", "working", "failure", "drop"]);

export type ExerciseType = z.infer<typeof ExerciseTypeSchema>;
export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;
export type SessionWorkoutType = z.infer<typeof SessionWorkoutTypeSchema>;
export type SetType = z.infer<typeof SetTypeSchema>;
