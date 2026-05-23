import type { CardioSession, StrengthSession, TrainingSession } from "@/data/schemas/training-history";

type StatusLastSessionProps = {
  session: TrainingSession | undefined;
  today: "push" | "pull" | "legs" | "cardio" | "rest";
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} MIN`;
  return `${Math.floor(minutes / 60)}H ${String(minutes % 60).padStart(2, "0")}M`;
}

function formatVolume(kg: number) {
  return `${(kg / 1000).toFixed(1)}T`;
}

function formatPace(secondsPerUnit: number, unit: string) {
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} ${unit}`;
}

function formatChange(percent: number) {
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

function formatCountDelta(value: number, unit: string) {
  const sign = value > 0 ? "+" : "";
  const label = Math.abs(value) === 1 ? unit : `${unit}S`;
  return `${sign}${value} ${label}`;
}

function formatUnitDelta(value: number, unit: string) {
  return `${value > 0 ? "+" : ""}${value} ${unit}`;
}

function formatPaceDelta(seconds: number, unit: string) {
  const sign = seconds < 0 ? "-" : "+";
  const abs = Math.abs(seconds);
  const minutes = Math.floor(abs / 60);
  const secs = Math.round(abs % 60);
  return `${sign}${minutes}:${String(secs).padStart(2, "0")} ${unit}`;
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
}

function MetricColumn({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string | null;
}) {
  return (
    <div>
      <p className="text font-semibold">{value}</p>
      <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground -translate-y-1">{label}</p>
      <p className="text-xs font-medium text-muted-foreground">{delta ?? "—"}</p>
    </div>
  );
}

function StrengthSummary({ session }: { session: StrengthSession }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <MetricColumn
        label="Sets"
        value={`${session.workingSetsCompleted}/${session.workingSetsPlanned}`}
        delta={session.setsDelta === null ? null : formatCountDelta(session.setsDelta, "SET")}
      />
      <MetricColumn
        label="Reps"
        value={`${session.repsCompleted}/${session.repsPlanned}`}
        delta={session.repsDelta === null ? null : formatCountDelta(session.repsDelta, "REP")}
      />
      <MetricColumn
        label="Duration"
        value={formatDuration(session.durationMinutes)}
        delta={session.durationDeltaMinutes === null ? null : formatUnitDelta(session.durationDeltaMinutes, "MIN")}
      />
      <MetricColumn
        label="Volume"
        value={formatVolume(session.volumeKg)}
        delta={session.volumeDeltaPercent === null ? null : formatChange(session.volumeDeltaPercent)}
      />
    </div>
  );
}

function getPerformanceColumn(session: CardioSession): { label: string; value: string; delta: string | null } {
  if (session.activity === "cycle") {
    return {
      label: "Avg speed",
      value: `${session.averageSpeedKmh}KM/H`,
      delta: session.averageSpeedDeltaKmh === null ? null : formatUnitDelta(session.averageSpeedDeltaKmh, "KM/H"),
    };
  }

  if (session.activity === "swim") {
    return {
      label: "Avg pace",
      value: formatPace(session.averageSwimPaceSecondsPer100m!, "/100M"),
      delta:
        session.averageSwimPaceDeltaSecondsPer100m === null
          ? null
          : formatPaceDelta(session.averageSwimPaceDeltaSecondsPer100m, "/100M"),
    };
  }

  return {
    label: "Avg pace",
    value: formatPace(session.averagePaceSecondsPerKm!, "/KM"),
    delta:
      session.averagePaceDeltaSecondsPerKm === null
        ? null
        : formatPaceDelta(session.averagePaceDeltaSecondsPerKm, "/KM"),
  };
}

function CardioSummary({ session }: { session: CardioSession }) {
  const performance = getPerformanceColumn(session);

  return (
    <div className="grid grid-cols-4">
      <MetricColumn label="Type" value={session.activity.toUpperCase()} delta="" />
      <MetricColumn
        label="Duration"
        value={formatDuration(session.durationMinutes)}
        delta={session.durationDeltaMinutes === null ? null : formatUnitDelta(session.durationDeltaMinutes, "MIN")}
      />
      <MetricColumn
        label="Distance"
        value={`${session.distanceKm} KM`}
        delta={session.distanceDeltaKm === null ? null : formatUnitDelta(session.distanceDeltaKm, "KM")}
      />
      <MetricColumn {...performance} />
    </div>
  );
}

export function StatusLastSession({ session, today }: StatusLastSessionProps) {
  return (
    <section className="mt-8 border-t pt-2">
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest">Last Session</h2>

      {!session ? (
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          No previous {today} session
        </p>
      ) : (
        <div className="space-y-3">
          <p className="font-mono font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            {session.type === "strength" ? session.routine : session.activity} ·{" "}
            {formatShortDate(session.date)}
          </p>

          {session.type === "strength" ? (
            <StrengthSummary session={session} />
          ) : (
            <CardioSummary session={session} />
          )}
        </div>
      )}
    </section>
  );
}
