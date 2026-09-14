import type { Weight } from "@/data/schemas/weight";

type WeightSparklineProps = {
  entries: Weight;
  days?: number;
};

// A glanceable, axis-free trend indicator — deliberately not the full
// LineChartStatus treatment (ticket 03: chosen over duplicating that chart
// here, which read as heavier than this page needs).
export function WeightSparkline({ entries, days = 30 }: WeightSparklineProps) {
  const values = entries.slice(-days).map((entry) => entry.kg);
  if (values.length < 2) return null;

  const width = 200;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="mb-6">
      <p className="font-mono text-xs uppercase text-muted-foreground">{days}-day trend</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-8 w-full text-primary" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    </section>
  );
}
