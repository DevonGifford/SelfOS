import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createFoodEntry, deleteFoodEntry, updateFoodEntry } from "@/data/client";
import type { FoodEntries } from "@/data/schemas/food-entries";

const ENTRIES_KEY = ["food-entries"];

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// Logging a meal isn't self-reversing the way a habit checklist toggle is
// — there's no "tap again" that undoes eating a specific entry — so this
// follows measurements' pattern (commit immediately, toast+undo via a
// compensating call), not habits' checklist-toggle pattern (decision 15).

export function useCreateFoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { foodId: string; quantity: number; date: string }) => createFoodEntry(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ENTRIES_KEY });
      const previous = queryClient.getQueryData<FoodEntries>(ENTRIES_KEY);
      const optimisticId = tempId();
      const optimistic = {
        id: optimisticId,
        foodId: input.foodId,
        name: "…",
        quantity: input.quantity,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        date: input.date,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(ENTRIES_KEY, context.previous);
      toastManager.add({ title: "Failed to log food", timeout: 4000 });
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === context?.optimisticId ? created : entry)),
      );

      toastManager.add({
        title: `${created.name.toUpperCase()} LOGGED`,
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            deleteFoodEntry(created.id)
              .then(() => {
                queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
                  (old ?? []).filter((entry) => entry.id !== created.id),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
              });
          },
        },
      });
    },
  });
}

export function useUpdateFoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateFoodEntry(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ENTRIES_KEY });
      const previous = queryClient.getQueryData<FoodEntries>(ENTRIES_KEY);
      const previousEntry = previous?.find((entry) => entry.id === id);
      queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === id ? { ...entry, quantity } : entry)),
      );
      return { previous, previousEntry };
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(ENTRIES_KEY, context.previous);
      toastManager.add({ title: "Failed to update entry", timeout: 4000 });
    },
    onSuccess: (updated, _vars, context) => {
      queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === updated.id ? updated : entry)),
      );

      const previousEntry = context?.previousEntry;
      if (!previousEntry) return;

      toastManager.add({
        title: "UPDATED",
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            updateFoodEntry(updated.id, previousEntry.quantity)
              .then((restored) => {
                queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
                  (old ?? []).map((entry) => (entry.id === restored.id ? restored : entry)),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
              });
          },
        },
      });
    },
  });
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFoodEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ENTRIES_KEY });
      const previous = queryClient.getQueryData<FoodEntries>(ENTRIES_KEY);
      const deletedEntry = previous?.find((entry) => entry.id === id);
      queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).filter((entry) => entry.id !== id),
      );
      return { previous, deletedEntry };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(ENTRIES_KEY, context.previous);
      toastManager.add({ title: "Failed to delete entry", timeout: 4000 });
    },
    onSuccess: (_result, _id, context) => {
      const deletedEntry = context?.deletedEntry;
      if (!deletedEntry || !deletedEntry.foodId) return;

      toastManager.add({
        title: "DELETED",
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            createFoodEntry({
              foodId: deletedEntry.foodId!,
              quantity: deletedEntry.quantity,
              date: deletedEntry.date,
            })
              .then((restored) => {
                queryClient.setQueryData<FoodEntries>(ENTRIES_KEY, (old) => [...(old ?? []), restored]);
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
              });
          },
        },
      });
    },
  });
}
