import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createExercise, getExercises } from "@/data/client";
import type { Exercises } from "@/data/schemas/exercises";
import type { ExerciseType, WorkoutType } from "@/data/schemas/training-shared";

export const EXERCISES_KEY = ["exercises"];

export function useExercises() {
  return useQuery({ queryKey: EXERCISES_KEY, queryFn: getExercises });
}

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// No undo toast — creating an Exercise Definition is a quiet setup step
// (usually mid-picker, adding one you forgot), not a loggable Event.
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; type: ExerciseType; workoutType: WorkoutType }) =>
      createExercise(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: EXERCISES_KEY });
      const previous = queryClient.getQueryData<Exercises>(EXERCISES_KEY);
      const optimisticId = tempId();
      const optimistic = { id: optimisticId, ...input, createdAt: new Date().toISOString() };
      queryClient.setQueryData<Exercises>(EXERCISES_KEY, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(EXERCISES_KEY, context.previous);
      toastManager.add({ title: "Failed to create exercise", timeout: 4000 });
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<Exercises>(EXERCISES_KEY, (old) =>
        (old ?? []).map((exercise) => (exercise.id === context?.optimisticId ? created : exercise)),
      );
    },
  });
}
