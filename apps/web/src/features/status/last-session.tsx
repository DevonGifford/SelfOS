import { Link } from "react-router";

import { SESSION_TYPE_LABEL } from "@/features/training/labels";
import type { SessionWorkoutType } from "@/data/schemas/training-shared";

type StatusLastSessionProps = {
  lastFinishedSession: { workoutType: SessionWorkoutType; date: string } | null;
  unfinishedSession: { id: string; workoutType: SessionWorkoutType } | null;
};

function formatRelativeDate(date: string): string {
  const days = Math.round((Date.parse(`${date}T00:00:00`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00`)) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return date;
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
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Last workout: {SESSION_TYPE_LABEL[lastFinishedSession.workoutType]} ·{" "}
          {formatRelativeDate(lastFinishedSession.date)}
        </p>
      )}
    </section>
  );
}
