import { useQuery } from "@tanstack/react-query";

import { HeaderStatus } from "@/components/status/header-status";
import { HeatmapStatus } from "@/components/status/heatmap-status";
import { LastSessionStatus } from "@/components/status/last-session-status";
import { LineChartStatus } from "@/components/status/line-chart-status";
import { NutritionStatus } from "@/components/status/nutrition-status";
import { getStatus } from "@/data/client";
import { useHabitsHistory } from "@/features/habits/use-habits-history";
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

  return (
    <div className="p-4">
      <HeaderStatus
        training={data.training}
        measurementsKg={data.measurements.kg}
        habits={data.habits}
      />

      <NutritionStatus nutrition={data.nutrition} />

      <LastSessionStatus session={lastSession} today={data.training.type} />

      <LineChartStatus entries={measurementsQuery.data} />

      <HeatmapStatus entries={historyQuery.data} />
    </div>
  );
}
