import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelWorkoutSession,
  createWorkoutSession,
  finishWorkoutSession,
  getUnfinishedWorkoutSession,
  getWorkoutSession,
  getWorkoutSessions,
  saveAsTemplate,
  updateSourceTemplate,
  updateWorkoutSession,
} from "@/data/client";
import type { SessionWorkoutType, WorkoutType } from "@/data/schemas/training-shared";
import type { WorkoutSession } from "@/data/schemas/workout-sessions";

export const WORKOUT_SESSIONS_KEY = ["workout-sessions"];
export const UNFINISHED_SESSION_KEY = ["unfinished-workout-session"];

export function useWorkoutSessions() {
  return useQuery({ queryKey: WORKOUT_SESSIONS_KEY, queryFn: getWorkoutSessions });
}

// The route-level "is there a session to resume" check (ticket 03) — every
// page that can start or continue a workout reads this one query.
export function useUnfinishedWorkoutSession() {
  return useQuery({ queryKey: UNFINISHED_SESSION_KEY, queryFn: getUnfinishedWorkoutSession });
}

export function useWorkoutSession(id: string | null) {
  return useQuery({
    queryKey: ["workout-session", id],
    queryFn: () => getWorkoutSession(id!),
    enabled: id !== null,
  });
}

export function useCreateWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { workoutType: SessionWorkoutType; templateId?: string | null }) =>
      createWorkoutSession(input),
    onSuccess: (created) => {
      queryClient.setQueryData<WorkoutSession>(UNFINISHED_SESSION_KEY, created);
      queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
    },
  });
}

export function useUpdateWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      note?: string;
      startedAt?: string;
      finishedAt?: string;
    }) => updateWorkoutSession(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["workout-session", updated.id], updated);
      queryClient.setQueryData<WorkoutSession | null>(UNFINISHED_SESSION_KEY, (old) =>
        old && old.id === updated.id ? updated : old,
      );
      queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
    },
  });
}

export function useFinishWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => finishWorkoutSession(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["workout-session", updated.id], updated);
      queryClient.setQueryData(UNFINISHED_SESSION_KEY, null);
      queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
    },
  });
}

// "Cancel Workout" — a hard delete, no undo (ticket 03: confirmed via a
// destructive-action dialog in the UI, not this hook).
export function useCancelWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelWorkoutSession(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData(UNFINISHED_SESSION_KEY, null);
      queryClient.removeQueries({ queryKey: ["session-exercises", id] });
      queryClient.invalidateQueries({ queryKey: WORKOUT_SESSIONS_KEY });
    },
  });
}

export function useUpdateSourceTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => updateSourceTemplate(sessionId),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["workout-template-sets", updatedTemplate.id] });
    },
  });
}

export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, ...input }: { sessionId: string; workoutType: WorkoutType; name: string }) =>
      saveAsTemplate(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
    },
  });
}
