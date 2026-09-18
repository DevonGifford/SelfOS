import type { SessionWorkoutType, WorkoutType } from "@/data/schemas/training-shared";

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  cardio: "Cardio",
};

export const SESSION_TYPE_LABEL: Record<SessionWorkoutType, string> = {
  ...WORKOUT_TYPE_LABEL,
  freestyle: "Freestyle",
};

export const WORKOUT_TYPE_SUBTITLE: Record<WorkoutType, string> = {
  push: "Chest · Shoulders · Triceps",
  pull: "Back · Biceps",
  legs: "Quads · Hamstrings · Calves",
  cardio: "Cardio · Core",
};
