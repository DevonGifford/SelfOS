import { SectionStat } from "@/components/ui/section-stat";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";

export function MeasurementsPage() {
  const query = useMeasurements();

  if (!query.data) return null;

  const { data } = query;

  // Same day-minimum rule as the Status ring/trend chart (decision 02) —
  // "Latest" is the most recent day's lowest reading, not just whichever
  // row the API happened to return first.
  const latest = selectDailyMinimums(data).at(-1);

  return (
    <div className="p-4">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest">
          SELF/OS
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Weight</h1>
      </header>

      <SectionStat label="Latest" value={latest ? `${latest.kg} kg` : "—"} />

      <SectionStat label="Log">
        <ul className="space-y-3">
          {data.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between">
              <span>{entry.date}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {entry.kg} kg
              </span>
            </li>
          ))}
        </ul>
      </SectionStat>
    </div>
  );
}
