import { Link } from "react-router";

import { SESSION_TYPE_LABEL } from "@/features/training/labels";
import { useSessionExercises } from "@/features/training/use-session-exercises";
import { useSessionSets } from "@/features/training/use-workout-sets";
import { summarizeSessionSets } from "@/features/status/summarize-session-sets";
import type { SessionWorkoutType } from "@/data/schemas/training-shared";

type StatusLastSessionProps = {
  lastFinishedSession: { id: string; workoutType: SessionWorkoutType; date: string } | null;
  unfinishedSession: { id: string; workoutType: SessionWorkoutType } | null;
};

function formatRelativeDate(date: string): string {
  const days = Math.round((Date.parse(`${date}T00:00:00`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00`)) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return date;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

// Raw totals from the last finished Session's actual logged Sets — no
// comparison against a previous session (that's the explicitly deferred
// "deltas" feature, see .scratch/training-feature/map.md's "Not yet
// specified"). Strength and cardio stats are independent: a Freestyle
// session mixing both kinds shows both rows.
function LastSessionStats({ sessionId }: { sessionId: string }) {
  const sessionExercisesQuery = useSessionExercises(sessionId);
  const sessionExerciseIds = (sessionExercisesQuery.data ?? []).map((se) => se.id);
  const { bySessionExerciseId, isPending } = useSessionSets(sessionExerciseIds);

  if (sessionExercisesQuery.isPending || isPending) return null;

  const allSets = sessionExerciseIds.flatMap((id) => bySessionExerciseId.get(id) ?? []);
  const summary = summarizeSessionSets(allSets);

  if (summary.strengthSetsCount === 0 && summary.cardioSetsCount === 0) return null;

  return (
    <div className="mt-3 flex gap-6">
      {summary.strengthSetsCount > 0 ? (
        <>
          <Stat label="Sets" value={String(summary.strengthSetsCount)} />
          <Stat label="Volume" value={`${Math.round(summary.volumeKg)} kg`} />
        </>
      ) : null}
      {summary.cardioSetsCount > 0 ? (
        <>
          <Stat label="Duration" value={formatDuration(summary.durationSec)} />
          <Stat label="Distance" value={formatDistance(summary.distanceM)} />
        </>
      ) : null}
    </div>
  );
}

export function StatusLastSession({ lastFinishedSession, unfinishedSession }: StatusLastSessionProps) {
  return (
    <section className="mt-8 border-t pt-2">
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest">Training</h2>

      {unfinishedSession ? (
        <Link
          to="/training"
          className="mt-2 flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium"
        >
          Resume {SESSION_TYPE_LABEL[unfinishedSession.workoutType]} workout
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      {!lastFinishedSession ? (
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          No workouts logged yet
        </p>
      ) : (
        <>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Last workout: {SESSION_TYPE_LABEL[lastFinishedSession.workoutType]} ·{" "}
            {formatRelativeDate(lastFinishedSession.date)}
          </p>
          <LastSessionStats sessionId={lastFinishedSession.id} />
        </>
      )}
    </section>
  );
}
