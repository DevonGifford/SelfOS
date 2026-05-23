import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionStat } from "@/components/ui/section-stat";
import { ApiError } from "@/data/api-client";
import type { Weight, WeightEntry } from "@/data/schemas/weight";
import { MeasurementDrawer } from "@/features/measurements/measurement-drawer";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";
import { WeightSparkline } from "@/features/measurements/weight-sparkline";

const PAGE_SIZE = 30;

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Sorted newest first; within a date, lowest reading first so the
// day-minimum row (CONTEXT.md's day-minimum rule) is always what a reader
// sees before any other same-day entry.
function sortForJournal(entries: Weight): Weight {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.kg - b.kg;
  });
}

function SkeletonRow() {
  return (
    <div className="flex items-baseline justify-between py-3">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="h-3 w-12 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function MeasurementsPage() {
  const query = useMeasurements();
  const [editingEntry, setEditingEntry] = useState<WeightEntry | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A network failure never reaches the API and surfaces as a plain fetch
  // error, not an ApiError (data/api-client.ts only wraps a response the
  // server actually sent). That split is what lets "offline" (scope B —
  // .scratch/pwa-release/issues/01-pwa-scope.md — the app shell installs
  // and opens offline, but data still needs the network) read differently
  // from a real server error instead of both saying the same generic thing.
  const isOffline = query.isError && !(query.error instanceof ApiError);
  const state = query.isPending
    ? "loading"
    : query.isError
      ? isOffline
        ? "offline"
        : "error"
      : (query.data?.length ?? 0) === 0
        ? "empty"
        : "ready";

  const entries = state === "ready" ? (query.data ?? []) : [];
  const dailyMinimums = selectDailyMinimums(entries);
  const sorted = sortForJournal(entries);
  const latest = dailyMinimums.at(-1);
  const visible = sorted.slice(0, visibleCount);

  const countsByDate = new Map<string, number>();
  for (const entry of sorted) {
    countsByDate.set(entry.date, (countsByDate.get(entry.date) ?? 0) + 1);
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((observerEntries) => {
      if (observerEntries[0]?.isIntersecting) {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, sorted.length));
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [sorted.length]);

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
          <p className="font-mono text-xs uppercase tracking-widest">SELF/OS</p>
          <h1 className="mt-2 text-3xl font-semibold">Weight</h1>
        </div>

        <Button size="sm" onClick={openAddDrawer}>
          Log Weight
        </Button>
      </header>

      {state === "loading" && (
        <>
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
          <SectionStat label="Log">
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </SectionStat>
        </>
      )}

      {state === "error" && (
        <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Couldn't load your weight history.</p>
          <p className="mt-1 text-muted-foreground">Something went wrong on our end — try again.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {state === "offline" && (
        <div className="mt-8 rounded-lg border p-4 text-sm">
          <p className="font-medium">You're offline.</p>
          <p className="mt-1 text-muted-foreground">Your weight history needs a connection to load.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {state === "empty" && (
        <div className="mt-8 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No weigh-ins yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Log your first to start the trend.</p>
          <Button size="sm" className="mt-4" onClick={openAddDrawer}>
            Log Weight
          </Button>
        </div>
      )}

      {state === "ready" && (
        <>
          <WeightSparkline entries={dailyMinimums} />

          <SectionStat label="Latest" value={latest ? `${latest.kg} kg` : "—"} />

          <SectionStat label="Log">
            <ul>
              {visible.map((entry, index) => {
                const isNewDate = index === 0 || entry.date !== visible[index - 1].date;
                const isDayMin = dailyMinimums.some((min) => min.id === entry.id);
                const hasSiblingSameDay = (countsByDate.get(entry.date) ?? 1) > 1;

                return (
                  <li key={entry.id} className={isNewDate ? "mt-3 first:mt-0" : ""}>
                    <button
                      type="button"
                      onClick={() => openEditDrawer(entry)}
                      className="flex w-full items-baseline justify-between py-1.5 text-left"
                    >
                      <span className={isNewDate ? "" : "pl-4 text-xs text-muted-foreground"}>
                        {isNewDate ? formatDate(entry.date) : "same day"}
                      </span>
                      <span
                        className={
                          isDayMin
                            ? "font-mono text-sm font-semibold"
                            : "font-mono text-sm text-muted-foreground"
                        }
                      >
                        {isDayMin && hasSiblingSameDay && (
                          <span className="mr-1.5 rounded bg-primary/10 px-1 text-[9px] font-sans uppercase text-primary">
                            min
                          </span>
                        )}
                        {entry.kg} kg
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {visibleCount < sorted.length && <div ref={sentinelRef} className="h-8" />}
          </SectionStat>
        </>
      )}

      <MeasurementDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entry={editingEntry}
      />
    </div>
  );
}
