import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createFood } from "@/data/client";
import type { Foods } from "@/data/schemas/foods";

const FOODS_KEY = ["foods"];

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

type FoodInput = {
  name: string;
  servingLabel: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
};

// Only "create" is wired to a mutation — editing/deleting an existing Food
// Definition has no UI trigger in v1 (decision 15), so those mutations
// aren't built here; the API routes exist and are Go-tested regardless.
// No undo toast here (unlike habits' useCreateHabit) — creating a Food is
// step one of "Create new food → log it," the entry that follows gets the
// undo (use-food-entry-mutations.ts), not this intermediate step.
export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FoodInput) => createFood(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: FOODS_KEY });
      const previous = queryClient.getQueryData<Foods>(FOODS_KEY);
      const optimisticId = tempId();
      const optimistic = { id: optimisticId, ...input, createdAt: new Date().toISOString() };
      queryClient.setQueryData<Foods>(FOODS_KEY, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(FOODS_KEY, context.previous);
      toastManager.add({ title: "Failed to create food", timeout: 4000 });
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<Foods>(FOODS_KEY, (old) =>
        (old ?? []).map((food) => (food.id === context?.optimisticId ? created : food)),
      );
    },
  });
}
