import { z } from "zod";

import { SessionWorkoutTypeSchema } from "@/data/schemas/training-shared";

// A Workout Session is the Event-container (CONTEXT.md) — one training
// occasion. Persists as soon as it starts, not only once finished (ADR
// 0003), so `finishedAt` being null is the "in progress" state, not a
// separate status field.
export const WorkoutSessionSchema = z.object({
  id: z.string(),
  workoutType: SessionWorkoutTypeSchema,
  templateId: z.string().nullable(),
  note: z.string().nullable(),
  date: z.string(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const WorkoutSessionsSchema = z.array(WorkoutSessionSchema);

// One Exercise-within-a-Session — the home for an exercise-level note and
// its display position (ticket 01's workout_session_exercises table).
export const WorkoutSessionExerciseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  exerciseId: z.string().nullable(),
  exerciseName: z.string(),
  note: z.string().nullable(),
  position: z.number(),
});

export const WorkoutSessionExercisesSchema = z.array(WorkoutSessionExerciseSchema);

export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type WorkoutSessions = z.infer<typeof WorkoutSessionsSchema>;
export type WorkoutSessionExercise = z.infer<typeof WorkoutSessionExerciseSchema>;
export type WorkoutSessionExercises = z.infer<typeof WorkoutSessionExercisesSchema>;
