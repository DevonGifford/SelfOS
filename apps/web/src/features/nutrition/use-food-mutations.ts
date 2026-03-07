import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createFood, updateFood } from "@/data/client";
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

// No undo toast here (unlike habits' useCreateHabit) — creating a Food is
// step one of "Create new food → log it," the entry that follows gets the
// undo (use-food-entry-mutations.ts), not this intermediate step. Deleting
// a Food still has no UI trigger — that route exists and is Go-tested but
// stays unwired for now.
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

// The "Update Food" branch of the entry-adjustment drawer's save choice —
// overwrites this Food's per-serving rate with today's adjusted amounts
// (divided back down to a per-serving basis by the caller). Mirrors
// useUpdateHabit's optimistic patch + "UPDATED" toast + UNDO shape exactly.
export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FoodInput> }) => updateFood(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: FOODS_KEY });
      const previous = queryClient.getQueryData<Foods>(FOODS_KEY);
      const previousFood = previous?.find((food) => food.id === id);
      queryClient.setQueryData<Foods>(FOODS_KEY, (old) =>
        (old ?? []).map((food) => (food.id === id ? { ...food, ...input } : food)),
      );
      return { previous, previousFood };
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(FOODS_KEY, context.previous);
      toastManager.add({ title: "Failed to update food", timeout: 4000 });
    },
    onSuccess: (updated, _vars, context) => {
      queryClient.setQueryData<Foods>(FOODS_KEY, (old) =>
        (old ?? []).map((food) => (food.id === updated.id ? updated : food)),
      );

      const previousFood = context?.previousFood;
      if (!previousFood) return;

      toastManager.add({
        title: "FOOD UPDATED",
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            updateFood(updated.id, {
              name: previousFood.name,
              servingLabel: previousFood.servingLabel,
              caloriesPerServing: previousFood.caloriesPerServing,
              proteinPerServing: previousFood.proteinPerServing,
              carbsPerServing: previousFood.carbsPerServing,
              fatPerServing: previousFood.fatPerServing,
            })
              .then((restored) => {
                queryClient.setQueryData<Foods>(FOODS_KEY, (old) =>
                  (old ?? []).map((food) => (food.id === restored.id ? restored : food)),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: FOODS_KEY });
              });
          },
        },
      });
    },
  });
}
