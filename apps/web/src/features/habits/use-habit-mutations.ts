import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createHabit, reorderHabits, updateHabit } from "@/data/client";
import type { Habits } from "@/data/schemas/habits";

const HABITS_KEY = ["habits"];

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// Definition mutations (create/rename/deactivate) get the same
// commit-immediately + toast-with-undo pattern measurements uses for all
// its mutations — a habit's name/active status is exactly the same kind
// of edit as a weight entry's date/kg. Deleting a Definition has no undo
// path here since there's no delete route (decision 07/08) — undo for
// "create" is a real DELETE only because habit_entries reference habits by
// id, but a brand-new habit with zero entries is always safe to remove.

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createHabit(name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habits>(HABITS_KEY);
      const optimisticId = tempId();
      const optimistic = {
        id: optimisticId,
        name,
        active: true,
        position: previous?.length ?? 0,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Habits>(HABITS_KEY, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId };
    },
    onError: (_error, _name, context) => {
      if (context) queryClient.setQueryData(HABITS_KEY, context.previous);
      toastManager.add({ title: "Failed to add habit", timeout: 4000 });
    },
    onSuccess: (created, _name, context) => {
      queryClient.setQueryData<Habits>(HABITS_KEY, (old) =>
        (old ?? []).map((habit) => (habit.id === context?.optimisticId ? created : habit)),
      );

      toastManager.add({
        title: `${created.name.toUpperCase()} ADDED`,
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            updateHabit(created.id, { active: false })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: HABITS_KEY });
              })
              .finally(() => {
                queryClient.setQueryData<Habits>(HABITS_KEY, (old) =>
                  (old ?? []).filter((habit) => habit.id !== created.id),
                );
              });
          },
        },
      });
    },
  });
}

type UpdateInput = { name?: string; active?: boolean };

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInput }) => updateHabit(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habits>(HABITS_KEY);
      const previousHabit = previous?.find((habit) => habit.id === id);
      queryClient.setQueryData<Habits>(HABITS_KEY, (old) =>
        (old ?? []).map((habit) => (habit.id === id ? { ...habit, ...input } : habit)),
      );
      return { previous, previousHabit };
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(HABITS_KEY, context.previous);
      toastManager.add({ title: "Failed to update habit", timeout: 4000 });
    },
    onSuccess: (updated, _vars, context) => {
      queryClient.setQueryData<Habits>(HABITS_KEY, (old) =>
        (old ?? []).map((habit) => (habit.id === updated.id ? updated : habit)),
      );

      const previousHabit = context?.previousHabit;
      if (!previousHabit) return;

      toastManager.add({
        title: "UPDATED",
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            updateHabit(updated.id, { name: previousHabit.name, active: previousHabit.active })
              .then((restored) => {
                queryClient.setQueryData<Habits>(HABITS_KEY, (old) =>
                  (old ?? []).map((habit) => (habit.id === restored.id ? restored : habit)),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: HABITS_KEY });
              });
          },
        },
      });
    },
  });
}

// Reorder swaps are their own undo (tap the opposite arrow) — no toast,
// matches decision 09's scoped undo call.
export function useReorderHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => reorderHabits(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habits>(HABITS_KEY);
      queryClient.setQueryData<Habits>(HABITS_KEY, (old) => {
        const byId = new Map((old ?? []).map((habit) => [habit.id, habit]));
        return ids
          .map((id, index) => {
            const habit = byId.get(id);
            return habit ? { ...habit, position: index } : undefined;
          })
          .filter((habit): habit is Habits[number] => habit !== undefined);
      });
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context) queryClient.setQueryData(HABITS_KEY, context.previous);
      toastManager.add({ title: "Failed to reorder habits", timeout: 4000 });
    },
  });
}

