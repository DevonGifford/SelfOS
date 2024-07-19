import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import {
  addSessionExercise,
  getSessionExercises,
  removeSessionExercise,
  reorderSessionExercises,
  replaceSessionExercise,
  updateSessionExerciseNote,
} from "@/data/client";
import type { WorkoutSessionExercises } from "@/data/schemas/workout-sessions";

export function sessionExercisesKey(sessionId: string) {
  return ["session-exercises", sessionId];
}

export function useSessionExercises(sessionId: string | null) {
  return useQuery({
    queryKey: sessionExercisesKey(sessionId ?? ""),
    queryFn: () => getSessionExercises(sessionId!),
    enabled: sessionId !== null,
  });
}

export function useAddSessionExercise(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseId: string) => addSessionExercise(sessionId, exerciseId),
    onError: () => {
      toastManager.add({ title: "Failed to add exercise", timeout: 4000 });
    },
    onSuccess: (created) => {
      queryClient.setQueryData<WorkoutSessionExercises>(sessionExercisesKey(sessionId), (old) => [
        ...(old ?? []),
        created,
      ]);
    },
  });
}

// Full new order — mirrors useReorderHabits' optimistic-list-splice shape.
export function useReorderSessionExercises(sessionId: string) {
  const queryClient = useQueryClient();
  const key = sessionExercisesKey(sessionId);

  return useMutation({
    mutationFn: (ids: string[]) => reorderSessionExercises(sessionId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutSessionExercises>(key);
      const byId = new Map((previous ?? []).map((se) => [se.id, se]));
      const reordered = ids
        .map((id, index) => {
          const se = byId.get(id);
          return se ? { ...se, position: index } : undefined;
        })
        .filter((se): se is WorkoutSessionExercises[number] => se !== undefined);
      queryClient.setQueryData<WorkoutSessionExercises>(key, reordered);
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
      toastManager.add({ title: "Failed to reorder exercises", timeout: 4000 });
    },
  });
}

// Optimistic, matching this file's other mutations — a note edit should
// reflect immediately, not lag behind the round-trip. (Previously wasn't
// optimistic, which forced logging-screen.tsx to keep its own local echo
// of in-flight notes; that shadow state is gone now that the cache itself
// updates right away.)
export function useUpdateSessionExerciseNote(sessionId: string) {
  const queryClient = useQueryClient();
  const key = sessionExercisesKey(sessionId);

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => updateSessionExerciseNote(id, note),
    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkoutSessionExercises>(key);
      queryClient.setQueryData<WorkoutSessionExercises>(key, (old) =>
        (old ?? []).map((se) => (se.id === id ? { ...se, note } : se)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
      toastManager.add({ title: "Failed to save note", timeout: 4000 });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<WorkoutSessionExercises>(key, (old) =>
        (old ?? []).map((se) => (se.id === updated.id ? updated : se)),
      );
    },
  });
}

// Swaps the Exercise at this slot in place — drops its already-logged
// Sets, so the set-list cache for this row needs invalidating too.
export function useReplaceSessionExercise(sessionId: string) {
  const queryClient = useQueryClient();
  const key = sessionExercisesKey(sessionId);

  return useMutation({
    mutationFn: ({ id, exerciseId }: { id: string; exerciseId: string }) =>
      replaceSessionExercise(id, exerciseId),
    onError: () => {
      toastManager.add({ title: "Failed to replace exercise", timeout: 4000 });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<WorkoutSessionExercises>(key, (old) =>
        (old ?? []).map((se) => (se.id === updated.id ? updated : se)),
      );
      queryClient.invalidateQueries({ queryKey: ["workout-sets", updated.id] });
    },
  });
}

export function useRemoveSessionExercise(sessionId: string) {
  const queryClient = useQueryClient();
  const key = sessionExercisesKey(sessionId);

  return useMutation({
    mutationFn: (id: string) => removeSessionExercise(id),
    onError: () => {
      toastManager.add({ title: "Failed to remove exercise", timeout: 4000 });
    },
    onSuccess: (_result, id) => {
      queryClient.setQueryData<WorkoutSessionExercises>(key, (old) =>
        (old ?? []).filter((se) => se.id !== id),
      );
      queryClient.removeQueries({ queryKey: ["workout-sets", id] });
    },
  });
}
