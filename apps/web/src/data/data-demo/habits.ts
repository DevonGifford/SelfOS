import type { Habits } from "@/data/schemas/habits";

export const demoHabits: Habits = [
  { id: "habit-1", name: "Morning walk", streak: 12, completedToday: true },
  { id: "habit-2", name: "Read 20 min", streak: 5, completedToday: true },
  { id: "habit-3", name: "No sugar", streak: 3, completedToday: true },
  { id: "habit-4", name: "Stretch", streak: 0, completedToday: false },
  { id: "habit-5", name: "Journal", streak: 8, completedToday: false },
];
