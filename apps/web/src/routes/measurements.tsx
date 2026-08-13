import { SectionStat } from "@/components/ui/section-stat";
import { useMeasurements } from "@/features/measurements/use-measurements";

export function MeasurementsPage() {
  const query = useMeasurements();

  if (!query.data) return null;

  const { data } = query;

  const latest = data[data.length - 1];

  return (
    <div className="p-4">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest">
          SELF/OS
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Weight</h1>
      </header>

      <SectionStat label="Latest" value={`${latest.kg} kg`} />

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
