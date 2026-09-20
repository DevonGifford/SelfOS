import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { ApiError } from "@/data/http";
import type { Weight, WeightEntry } from "@/data/schemas/weight";
import { MeasurementDrawer } from "@/features/measurements/measurement-drawer";
import { selectDailyMinimums } from "@/features/measurements/select-daily-minimums";
import { useMeasurements } from "@/features/measurements/use-measurements";
import { WeightSparkline } from "@/features/measurements/weight-sparkline";
import { cn } from "@/lib/utils";
import { useOpenAddFromQuery } from "@/lib/use-open-add-from-query";

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

type DateGroup = { date: string; primary: WeightEntry; extras: WeightEntry[] };

// sortForJournal already orders same-date entries lowest-kg-first, so a
// group's `primary` is always that date's minimum — the same entry
// selectDailyMinimums would pick. No separate "is this the day min" check
// needed; extras are simply whatever's left after the first same-date entry.
function groupByDate(entries: Weight): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last && last.date === entry.date) {
      last.extras.push(entry);
    } else {
      groups.push({ date: entry.date, primary: entry, extras: [] });
    }
  }
  return groups;
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
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const today = new Date();
  const [viewedMonth, setViewedMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const isCurrentMonth = viewedMonth.year === today.getFullYear() && viewedMonth.month === today.getMonth();
  const monthName = new Date(viewedMonth.year, viewedMonth.month, 1)
    .toLocaleDateString("en-GB", { month: "long" })
    .toUpperCase();
  const monthLabel = `${monthName} '${String(viewedMonth.year).slice(-2)}`;

  function goToPrevMonth() {
    const d = new Date(viewedMonth.year, viewedMonth.month - 1, 1);
    setViewedMonth({ year: d.getFullYear(), month: d.getMonth() });
  }

  function goToNextMonth() {
    if (isCurrentMonth) return;
    const d = new Date(viewedMonth.year, viewedMonth.month + 1, 1);
    setViewedMonth({ year: d.getFullYear(), month: d.getMonth() });
  }

  function toggleExpanded(date: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  // A network failure never reaches the API and surfaces as a plain fetch
  // error, not an ApiError (data/http.ts only wraps a response the
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

  const monthKey = `${viewedMonth.year}-${String(viewedMonth.month + 1).padStart(2, "0")}`;
  const monthEntries = sorted.filter((entry) => entry.date.startsWith(monthKey));
  const groups = groupByDate(monthEntries);

  function openAddDrawer() {
    setEditingEntry(undefined);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  useOpenAddFromQuery(openAddDrawer);

  function openEditDrawer(entry: WeightEntry) {
    setEditingEntry(entry);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col p-4">
      <div className="shrink-0">
        <div className="mb-4">
          <Header
            eyebrow="SELF/OS"
            title="Weight"
            primary={latest ? { label: "Latest", value: `${latest.kg} kg`, progress: 1 } : undefined}
            note={
              <Button size="sm" onClick={openAddDrawer}>
                Log Weight
              </Button>
            }
          />
        </div>

        {state === "ready" && (
          <>
            <WeightSparkline entries={dailyMinimums} />

            <div className="flex items-center justify-between border-t pt-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">{monthLabel}</p>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={goToPrevMonth} aria-label="Previous month">
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={isCurrentMonth}
                  onClick={goToNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {state === "loading" && (
          <>
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
            <div className="space-y-1 pt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
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
            <ul>
              {groups.map((group) => (
                <li key={group.date} className="mt-3 first:mt-0">
                  <div className="flex w-full items-center gap-1 py-1.5">
                    <button
                      type="button"
                      onClick={() => openEditDrawer(group.primary)}
                      className="text-left"
                    >
                      {formatDate(group.date)}
                    </button>
                    {group.extras.length > 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleExpanded(group.date)}
                        aria-expanded={expandedDates.has(group.date)}
                        aria-label={
                          expandedDates.has(group.date) ? "Hide additional entries" : "Show additional entries"
                        }
                      >
                        <ChevronDown
                          className={cn("size-3.5 transition-transform", expandedDates.has(group.date) && "rotate-180")}
                        />
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditDrawer(group.primary)}
                      className="ml-auto font-mono text-sm font-semibold"
                    >
                      {group.primary.kg} kg
                    </button>
                  </div>

                  {group.extras.length > 0 && expandedDates.has(group.date) && (
                    <ul>
                      {group.extras.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => openEditDrawer(entry)}
                            className="flex w-full items-baseline justify-between py-1.5 pl-4 text-left"
                          >
                            <span className="text-xs text-muted-foreground">same day</span>
                            <span className="font-mono text-sm text-muted-foreground">{entry.kg} kg</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {groups.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                No entries in {monthLabel.charAt(0) + monthLabel.slice(1).toLowerCase()}.
              </p>
            )}
          </>
        )}
      </div>

      <MeasurementDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entry={editingEntry}
        latestKg={latest?.kg}
      />
    </div>
  );
}
