import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { createWorkoutSet, deleteWorkoutSet, getSetsForSessionExercise, updateWorkoutSet } from "@/data/client";
import type { SetType } from "@/data/schemas/training-shared";
import type { WorkoutSet } from "@/data/schemas/workout-sets";

export function workoutSetsKey(sessionExerciseId: string) {
  return ["workout-sets", sessionExerciseId];
}

export function useWorkoutSets(sessionExerciseId: string) {
  return useQuery({
    queryKey: workoutSetsKey(sessionExerciseId),
    queryFn: () => getSetsForSessionExercise(sessionExerciseId),
  });
}

// One query per Exercise-within-the-Session rather than a single
// session-wide sets list: a Set write only ever touches its own
// sessionExerciseId's cache entry, so logging a Bench set never
// invalidates or re-groups Squat's rows.
export function useSessionSets(sessionExerciseIds: string[]) {
  const results = useQueries({
    queries: sessionExerciseIds.map((id) => ({
      queryKey: workoutSetsKey(id),
      queryFn: () => getSetsForSessionExercise(id),
    })),
  });

  const bySessionExerciseId = new Map<string, WorkoutSet[]>();
  sessionExerciseIds.forEach((id, index) => {
    bySessionExerciseId.set(id, results[index]?.data ?? []);
  });

  return {
    bySessionExerciseId,
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
  };
}

type WorkoutSetInput = {
  sessionExerciseId: string;
  setType: SetType;
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
  note?: string | null;
};

function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

// Optimistic, no undo toast — Sets are logged far more frequently than any
// other Event in this app (every rep of every exercise), so the undo-toast
// ceremony use-food-entry-mutations.ts relies on would be constant noise
// here. Delete/edit mistakes are corrected by editing the row again.
export function useCreateWorkoutSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WorkoutSetInput) => createWorkoutSet(input),
    onMutate: async (input) => {
      const key = workoutSetsKey(input.sessionExerciseId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutSet[]>(key);
      const optimisticId = tempId();
      const optimistic: WorkoutSet = {
        id: optimisticId,
        sessionExerciseId: input.sessionExerciseId,
        setType: input.setType,
        confirmed: false,
        note: input.note ?? null,
        weightKg: input.weightKg ?? null,
        reps: input.reps ?? null,
        durationSec: input.durationSec ?? null,
        distanceM: input.distanceM ?? null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<WorkoutSet[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId, key };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<WorkoutSet[]>(context?.key ?? workoutSetsKey(created.sessionExerciseId), (old) =>
        (old ?? []).map((set) => (set.id === context?.optimisticId ? created : set)),
      );
    },
  });
}

export function useUpdateWorkoutSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      sessionExerciseId: _sessionExerciseId,
      ...input
    }: {
      id: string;
      sessionExerciseId: string;
      setType?: SetType;
      confirmed?: boolean;
      weightKg?: number | null;
      reps?: number | null;
      durationSec?: number | null;
      distanceM?: number | null;
      note?: string | null;
    }) => updateWorkoutSet(id, input),
    onMutate: async ({ id, sessionExerciseId, ...input }) => {
      const key = workoutSetsKey(sessionExerciseId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutSet[]>(key);
      queryClient.setQueryData<WorkoutSet[]>(key, (old) =>
        (old ?? []).map((set) => (set.id === id ? { ...set, ...input } : set)),
      );
      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSuccess: (updated, { sessionExerciseId }) => {
      queryClient.setQueryData<WorkoutSet[]>(workoutSetsKey(sessionExerciseId), (old) =>
        (old ?? []).map((set) => (set.id === updated.id ? updated : set)),
      );
    },
  });
}

export function useDeleteWorkoutSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; sessionExerciseId: string }) => deleteWorkoutSet(id),
    onMutate: async ({ id, sessionExerciseId }) => {
      const key = workoutSetsKey(sessionExerciseId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutSet[]>(key);
      queryClient.setQueryData<WorkoutSet[]>(key, (old) => (old ?? []).filter((set) => set.id !== id));
      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
  });
}
