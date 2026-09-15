import { Header } from "@/components/ui/header";
import { StatusHeatmap } from "@/features/status/heatmap";
import { StatusLastSession } from "@/features/status/last-session";
import { StatusLineChart } from "@/features/status/line-chart";
import { StatusNutrition } from "@/features/status/nutrition";
import { useStatus } from "@/features/status/use-status";

function daysRemainingInYear(from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const endOfYear = new Date(from.getFullYear(), 11, 31);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endOfYear.getTime() - startOfToday.getTime()) / msPerDay);
}

export function StatusPage() {
  const { data } = useStatus();

  if (!data) return null;

  const latestKg = data.dailyMinimums.at(-1)?.kg ?? 0;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  const daysRemaining = daysRemainingInYear();

  return (
    <div className="p-4">
      <Header
        eyebrow={today}
        title={`${data.status.training.focus} Day`}
        subtitle={<span className="italic">{daysRemaining} days remaining</span>}
        note={
          <p className="font-mono text-xs italic font-thin text-muted-foreground">
            todo/ either quote or warning message
          </p>
        }
        primary={{
          label: "Daily Habit",
          value: `${data.status.habits.completed}/${data.status.habits.total}`,
          progress:
            data.status.habits.total > 0
              ? data.status.habits.completed / data.status.habits.total
              : 0,
          href: "/habits",
        }}
        secondary={{
          label: "kg",
          value: latestKg,
          progress: 0.8,
          href: "/measurements",
          linkClassName: "pb-2 -mb-2 pl-1 font-extrabold",
        }}
      />

      <StatusNutrition nutrition={data.status.nutrition} />

      <StatusLastSession session={data.lastSession} today={data.status.training.type} />

      <StatusLineChart entries={data.dailyMinimums} />

      <StatusHeatmap entries={data.habitsHistory} />
    </div>
  );
}
