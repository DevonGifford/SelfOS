import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createHabitEntry, deleteHabitEntry } from "@/data/client";
import type { HabitEntries } from "@/data/schemas/habit-entries";

const ENTRIES_KEY = ["habit-entries"];

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// The daily checklist toggle is a true toggle — tapping again *is* the
// undo, so unlike Definition mutations (use-habit-mutations.ts) there's
// no toast here (decision 09). Still commits immediately and optimistic,
// same as every other mutation in the app.
export function useToggleHabitEntry() {
  const queryClient = useQueryClient();

  const check = useMutation({
    mutationFn: (input: { habitId: string; date: string }) => createHabitEntry(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ENTRIES_KEY });
      const previous = queryClient.getQueryData<HabitEntries>(ENTRIES_KEY);
      const optimisticId = tempId();
      const optimistic = {
        id: optimisticId,
        habitId: input.habitId,
        date: input.date,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<HabitEntries>(ENTRIES_KEY, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(ENTRIES_KEY, context.previous);
      toastManager.add({ title: "Failed to check off habit", timeout: 4000 });
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<HabitEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === context?.optimisticId ? created : entry)),
      );
    },
  });

  const uncheck = useMutation({
    mutationFn: (id: string) => deleteHabitEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ENTRIES_KEY });
      const previous = queryClient.getQueryData<HabitEntries>(ENTRIES_KEY);
      queryClient.setQueryData<HabitEntries>(ENTRIES_KEY, (old) =>
        (old ?? []).filter((entry) => entry.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(ENTRIES_KEY, context.previous);
      toastManager.add({ title: "Failed to uncheck habit", timeout: 4000 });
    },
  });

  return { check, uncheck };
}
