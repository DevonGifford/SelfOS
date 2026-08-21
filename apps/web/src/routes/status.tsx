import { useQuery } from "@tanstack/react-query";

import { HeaderStatus } from "@/components/status/header-status";
import { HeatmapStatus } from "@/components/status/heatmap-status";
import { LastSessionStatus } from "@/components/status/last-session-status";
import { LineChartStatus } from "@/components/status/line-chart-status";
import { NutritionStatus } from "@/components/status/nutrition-status";
import { getStatus } from "@/data/client";
import { useHabitsHistory } from "@/features/habits/use-habits-history";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";
import { selectLastComparableSession } from "@/features/training/select-last-comparable-session";
import { useTrainingHistory } from "@/features/training/use-training-history";

export function StatusPage() {
  const statusQuery = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const historyQuery = useHabitsHistory();
  const trainingHistoryQuery = useTrainingHistory();
  const measurementsQuery = useMeasurements();

  if (
    !statusQuery.data ||
    !historyQuery.data ||
    !trainingHistoryQuery.data ||
    !measurementsQuery.data
  )
    return null;

  const { data } = statusQuery;
  const lastSession = selectLastComparableSession(
    trainingHistoryQuery.data,
    data.training.type,
  );

  // Measurements is real now (see the Client Seam) — its "current weight"
  // is derived here from the actual entries, not from getStatus()'s demo
  // aggregate, and uses the same day-minimum rule everywhere a single
  // weight number is shown (this ring, the trend chart, /measurements).
  const dailyMinimums = selectDailyMinimums(measurementsQuery.data);
  const latestKg = dailyMinimums.at(-1)?.kg ?? 0;

  return (
    <div className="p-4">
      <HeaderStatus
        training={data.training}
        measurementsKg={latestKg}
        habits={data.habits}
      />

      <NutritionStatus nutrition={data.nutrition} />

      <LastSessionStatus session={lastSession} today={data.training.type} />

      <LineChartStatus entries={dailyMinimums} />

      <HeatmapStatus entries={historyQuery.data} />
    </div>
  );
}
