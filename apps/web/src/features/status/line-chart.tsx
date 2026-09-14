import { CartesianGrid, Line, LineChart, LabelList, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Weight } from "@/data/schemas/weight";

type StatusLineChartProps = {
  entries: Weight;
};

const chartConfig = {
  kg: { label: "Weight", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

function formatTick(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// Tight domain around the visible data (not a 0-based default) so ~0.1-0.5kg
// day-to-day changes are actually visible, instead of flattened by a wide axis.
function getYDomain(entries: Weight): [number, number] {
  const values = entries.map((entry) => entry.kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.2, 0.3);
  return [min - padding, max + padding];
}

export function StatusLineChart({ entries }: StatusLineChartProps) {
  if (entries.length === 0) return null;

  // Sparse X-axis labels — every tick would clutter a compact chart, so
  // thin them out to roughly 4-5 visible labels regardless of dataset size.
  const tickInterval = Math.max(0, Math.ceil(entries.length / 4) - 1);

  return (
    <section className="mt-8 border-t pt-4">
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest">Weight Trend</h2>

      <ChartContainer config={chartConfig} className="mt-2 aspect-auto h-25 w-full">
        <LineChart
          accessibilityLayer
          data={entries}
          margin={{ top: 16, left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={tickInterval}
            tickFormatter={formatTick}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis domain={getYDomain(entries)} hide />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(value) => formatTick(String(value))}
              />
            }
          />
          <Line
            dataKey="kg"
            type="natural"
            stroke="var(--color-kg)"
            strokeWidth={2}
            dot={{ fill: "var(--color-kg)" }}
            activeDot={{ r: 6 }}
          >
            <LabelList
              position="top"
              offset={10}
              className="fill-foreground"
              fontSize={10}
            />
          </Line>
        </LineChart>
      </ChartContainer>
    </section>
  );
}
