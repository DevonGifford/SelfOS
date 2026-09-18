import type { WorkoutSet } from "@/data/schemas/workout-sets";

export type SessionSetsSummary = {
  strengthSetsCount: number;
  volumeKg: number;
  cardioSetsCount: number;
  durationSec: number;
  distanceM: number;
};

// Raw totals only — no comparison against a prior session (that's the
// explicitly deferred "deltas" feature). Only confirmed Sets count,
// mirroring the Workout Complete screen's own "N sets logged"
// (features/training/finished-screen.tsx) — a set someone added but never
// confirmed isn't "what happened." Strength and cardio counts are tracked
// separately (keyed off which fields a Set actually carries, not the
// Session's own Workout Type) so a Freestyle session mixing both kinds
// summarizes correctly too.
export function summarizeSessionSets(sets: WorkoutSet[]): SessionSetsSummary {
  const summary: SessionSetsSummary = {
    strengthSetsCount: 0,
    volumeKg: 0,
    cardioSetsCount: 0,
    durationSec: 0,
    distanceM: 0,
  };

  for (const set of sets) {
    if (!set.confirmed) continue;

    if (set.weightKg !== null && set.reps !== null) {
      summary.strengthSetsCount += 1;
      summary.volumeKg += set.weightKg * set.reps;
    }

    if (set.durationSec !== null || set.distanceM !== null) {
      summary.cardioSetsCount += 1;
      summary.durationSec += set.durationSec ?? 0;
      summary.distanceM += set.distanceM ?? 0;
    }
  }

  return summary;
}
