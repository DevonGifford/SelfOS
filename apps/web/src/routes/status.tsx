import { StatusHeader } from "@/features/status/header";
import { StatusHeatmap } from "@/features/status/heatmap";
import { StatusLastSession } from "@/features/status/last-session";
import { StatusLineChart } from "@/features/status/line-chart";
import { StatusNutrition } from "@/features/status/nutrition";
import { useStatus } from "@/features/status/use-status";

export function StatusPage() {
  const { data } = useStatus();

  if (!data) return null;

  const latestKg = data.dailyMinimums.at(-1)?.kg ?? 0;

  return (
    <div className="p-4">
      <StatusHeader
        training={data.status.training}
        measurementsKg={latestKg}
        habits={data.status.habits}
      />

      <StatusNutrition nutrition={data.status.nutrition} />

      <StatusLastSession session={data.lastSession} today={data.status.training.type} />

      <StatusLineChart entries={data.dailyMinimums} />

      <StatusHeatmap entries={data.habitsHistory} />
    </div>
  );
}
