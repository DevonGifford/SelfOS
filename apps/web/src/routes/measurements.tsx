import { useState } from "react";

import { MeasurementDrawer } from "@/components/custom/measurement-drawer";
import { Button } from "@/components/ui/button";
import { SectionStat } from "@/components/ui/section-stat";
import type { WeightEntry } from "@/data/schemas/weight";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";

export function MeasurementsPage() {
  const query = useMeasurements();
  const [editingEntry, setEditingEntry] = useState<WeightEntry | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);

  if (!query.data) return null;

  const { data } = query;

  // Same day-minimum rule as the Status ring/trend chart (decision 02) —
  // "Latest" is the most recent day's lowest reading, not just whichever
  // row the API happened to return first.
  const latest = selectDailyMinimums(data).at(-1);

  function openAddDrawer() {
    setEditingEntry(undefined);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  function openEditDrawer(entry: WeightEntry) {
    setEditingEntry(entry);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  return (
    <div className="p-4">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest">
            SELF/OS
          </p>

          <h1 className="mt-2 text-3xl font-semibold">Weight</h1>
        </div>

        <Button size="sm" onClick={openAddDrawer}>
          Log Weight
        </Button>
      </header>

      <SectionStat label="Latest" value={latest ? `${latest.kg} kg` : "—"} />

      <SectionStat label="Log">
        <ul className="space-y-3">
          {data.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => openEditDrawer(entry)}
                className="flex w-full items-baseline justify-between text-left"
              >
                <span>{entry.date}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {entry.kg} kg
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SectionStat>

      <MeasurementDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entry={editingEntry}
      />
    </div>
  );
}
