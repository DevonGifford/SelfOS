import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import {
  archiveWorkoutTemplate,
  getWorkoutTemplates,
  getWorkoutTemplateSets,
  restoreWorkoutTemplate,
  setDefaultWorkoutTemplate,
} from "@/data/client";
import type { WorkoutTemplates } from "@/data/schemas/workout-templates";

export const WORKOUT_TEMPLATES_KEY = ["workout-templates"];

export function useWorkoutTemplates() {
  return useQuery({ queryKey: WORKOUT_TEMPLATES_KEY, queryFn: getWorkoutTemplates });
}

export function useWorkoutTemplateSets(templateId: string | null) {
  return useQuery({
    queryKey: ["workout-template-sets", templateId],
    queryFn: () => getWorkoutTemplateSets(templateId!),
    enabled: templateId !== null,
  });
}

// Definition-level lifecycle toggles — optimistic, no undo toast (mirrors
// useUpdateHabit, not the Event-level undo pattern).
export function useArchiveWorkoutTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveWorkoutTemplate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
      const previous = queryClient.getQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY);
      queryClient.setQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, archived: true } : t)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
    },
  });
}

export function useRestoreWorkoutTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreWorkoutTemplate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
      const previous = queryClient.getQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY);
      queryClient.setQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, archived: false } : t)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previous);
      toastManager.add({ title: "Failed to restore template", timeout: 4000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
    },
  });
}

export function useSetDefaultWorkoutTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultWorkoutTemplate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
      const previous = queryClient.getQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY);
      const target = previous?.find((t) => t.id === id);
      queryClient.setQueryData<WorkoutTemplates>(WORKOUT_TEMPLATES_KEY, (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? { ...t, isDefault: true }
            : target && t.workoutType === target.workoutType
              ? { ...t, isDefault: false }
              : t,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context) queryClient.setQueryData(WORKOUT_TEMPLATES_KEY, context.previous);
      toastManager.add({ title: "Failed to set default template", timeout: 4000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_TEMPLATES_KEY });
    },
  });
}
