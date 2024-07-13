import { useQuery } from "@tanstack/react-query";

import { getLastSetsForExercise } from "@/data/client";
import type { SessionWorkoutType } from "@/data/schemas/training-shared";

// The progressive-overload prefill (map.md): the most recent Set(s) for
// this Exercise, from the last *finished* Session of this Workout Type.
// staleTime: Infinity — this is "history," it doesn't move mid-session
// (today's own sets aren't eligible, see the finished_at filter server
// and guest side), so there's nothing to refetch until the next mount.
// exerciseId is nullable — a session-exercise whose Exercise was since
// deleted (ON DELETE SET NULL) keeps its denormalized name but has
// nothing to look history up by.
export function useLastSetsForExercise(exerciseId: string | null, workoutType: SessionWorkoutType) {
  return useQuery({
    queryKey: ["last-sets", exerciseId, workoutType],
    queryFn: () => getLastSetsForExercise(exerciseId!, workoutType),
    enabled: exerciseId !== null,
    staleTime: Infinity,
  });
}
