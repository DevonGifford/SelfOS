import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { createMeasurement, deleteMeasurement, updateMeasurement } from "@/data/client";
import type { Weight, WeightEntry } from "@/data/schemas/weight";

const MEASUREMENTS_KEY = ["measurements"];

type MeasurementInput = {
  date: string;
  kg: number;
};

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// All three mutations commit immediately (real API call, no delayed
// commit) and show a short "UNDO" toast afterward that performs a
// compensating call — add's undo deletes, delete's undo re-creates (a new
// id, that's fine), edit's undo PATCHes back to the pre-edit values. Same
// mechanism for all three (decision 05/Q17/Q18), optimistic cache updates
// with rollback-on-error throughout (Q21).

export function useCreateMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MeasurementInput) => createMeasurement(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: MEASUREMENTS_KEY });
      const previous = queryClient.getQueryData<Weight>(MEASUREMENTS_KEY);
      const optimisticId = tempId();
      const optimistic: WeightEntry = { id: optimisticId, date: input.date, kg: input.kg };
      queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) => [optimistic, ...(old ?? [])]);
      return { previous, optimisticId };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(MEASUREMENTS_KEY, context.previous);
      toastManager.add({ title: "Failed to log weight", timeout: 4000 });
    },
    onSuccess: (created, _input, context) => {
      // Reconcile the optimistic temp-id row with the real one before the
      // undo toast fires — undo needs the server-assigned id to target.
      queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === context?.optimisticId ? created : entry)),
      );

      toastManager.add({
        title: `${created.kg} KG LOGGED`,
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            deleteMeasurement(created.id)
              .then(() => {
                queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
                  (old ?? []).filter((entry) => entry.id !== created.id),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: MEASUREMENTS_KEY });
              });
          },
        },
      });
    },
  });
}

export function useUpdateMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MeasurementInput }) => updateMeasurement(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: MEASUREMENTS_KEY });
      const previous = queryClient.getQueryData<Weight>(MEASUREMENTS_KEY);
      const previousEntry = previous?.find((entry) => entry.id === id);
      queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
        (old ?? []).map((entry) => (entry.id === id ? { ...entry, ...input } : entry)),
      );
      return { previous, previousEntry };
    },
    onError: (_error, _vars, context) => {
      if (context) queryClient.setQueryData(MEASUREMENTS_KEY, context.previous);
      toastManager.add({ title: "Failed to update entry", timeout: 4000 });
    },
    onSuccess: (updated, _vars, context) => {
      queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
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
            updateMeasurement(updated.id, { date: previousEntry.date, kg: previousEntry.kg })
              .then((restored) => {
                queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
                  (old ?? []).map((entry) => (entry.id === restored.id ? restored : entry)),
                );
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: MEASUREMENTS_KEY });
              });
          },
        },
      });
    },
  });
}

export function useDeleteMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMeasurement(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEASUREMENTS_KEY });
      const previous = queryClient.getQueryData<Weight>(MEASUREMENTS_KEY);
      const deletedEntry = previous?.find((entry) => entry.id === id);
      queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) =>
        (old ?? []).filter((entry) => entry.id !== id),
      );
      return { previous, deletedEntry };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(MEASUREMENTS_KEY, context.previous);
      toastManager.add({ title: "Failed to delete entry", timeout: 4000 });
    },
    onSuccess: (_result, _id, context) => {
      const deletedEntry = context?.deletedEntry;
      if (!deletedEntry) return;

      toastManager.add({
        title: "DELETED",
        timeout: 5000,
        actionProps: {
          children: "UNDO",
          onClick: () => {
            createMeasurement({ date: deletedEntry.date, kg: deletedEntry.kg })
              .then((restored) => {
                queryClient.setQueryData<Weight>(MEASUREMENTS_KEY, (old) => [restored, ...(old ?? [])]);
              })
              .catch(() => {
                void queryClient.invalidateQueries({ queryKey: MEASUREMENTS_KEY });
              });
          },
        },
      });
    },
  });
}
