import type { Weight } from "@/data/schemas/weight";

type WeightSparklineProps = {
  entries: Weight;
  days?: number;
  showStats?: boolean;
  showLabel?: boolean;
};

// A glanceable, axis-free trend indicator — deliberately not the full
// LineChartStatus treatment (ticket 03: chosen over duplicating that chart
// here, which read as heavier than this page needs). Home reuses this same
// component via `showStats` rather than maintaining a second implementation
// of the same 30-day weight trend. `showLabel` defaults true (Measurements'
// own usage); Home passes false since its StatusSection wrapper already
// supplies the "30-day trend" label as the collapsible section's title.
export function WeightSparkline({ entries, days = 30, showStats = false, showLabel = true }: WeightSparklineProps) {
  const windowed = entries.slice(-days);
  if (windowed.length === 0) return null;

  const values = windowed.map((entry) => entry.kg);
  const hasTrend = values.length >= 2;

  // Without showStats (Measurements' own usage), preserve the original
  // behavior exactly: a single reading isn't a trend, so render nothing.
  if (!hasTrend && !showStats) return null;

  const start = values[0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const now = values.at(-1) ?? start;

  const width = 200;
  const height = 32;
  const range = max - min || 1;
  const points = hasTrend
    ? values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ")
    : "";

  return (
    <section className="mb-2">
      {showLabel && <p className="font-mono text-xs uppercase text-muted-foreground">{days}-day trend</p>}

      {hasTrend && (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-8 w-full text-primary" preserveAspectRatio="none">
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
        </svg>
      )}

      {showStats && (
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>
            Start <span className="text-foreground">{start} kg</span>
          </span>
          <span>
            Low <span className="text-foreground">{min} kg</span>
          </span>
          <span>
            Now <span className="text-foreground">{now} kg</span>
          </span>
        </div>
      )}
    </section>
  );
}
