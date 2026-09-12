import type { Training } from "@/data/schemas/training";

export const demoTraining: Training = {
  type: "cardio",
  split: "cardio",
  tomorrow: "Cardio & Core",
  exercises: [
    { name: "Bench press", sets: 4, reps: 6, weight: 80 },
    { name: "Overhead press", sets: 3, reps: 8, weight: 45 },
    { name: "Incline dumbbell press", sets: 3, reps: 10, weight: 30 },
    { name: "Lateral raise", sets: 3, reps: 15, weight: 10 },
    { name: "Triceps pushdown", sets: 3, reps: 12, weight: 35 },
  ],
};
