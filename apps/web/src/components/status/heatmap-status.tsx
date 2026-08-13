import type { HabitHistoryEntry } from "@/data/schemas/habits-history";
import { cn } from "@/lib/utils";

type HeatmapStatusProps = {
  entries: HabitHistoryEntry[];
};

const DAY_LABELS = ["M", "T", "W", "Th", "F", "S", "Su"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Explicit square cells: width and height are set from the same constant,
// so squareness doesn't depend on the surrounding layout's width.
const CELL_SIZE = 12;
const CELL_GAP = 4;

function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function intensityClass(ratio: number) {
  if (ratio <= 0) return "bg-muted";
  if (ratio < 0.25) return "bg-primary/20";
  if (ratio < 0.5) return "bg-primary/40";
  if (ratio < 0.75) return "bg-primary/70";
  return "bg-primary";
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

export function HeatmapStatus({ entries }: HeatmapStatusProps) {
  return (
    <section className="mt-8 border-t pt-4">
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest">Habits Graph</h2>
      <div className="mt-4">
        <HabitHeatmap entries={entries} />
      </div>
    </section>
  );
}

function HabitHeatmap({ entries }: { entries: HabitHistoryEntry[] }) {
  if (entries.length === 0) return null;

  const firstDate = new Date(`${entries[0]!.date}T00:00:00`);
  const firstMonday = new Date(firstDate);
  firstMonday.setDate(firstDate.getDate() - mondayIndex(firstDate));

  const weeks: (HabitHistoryEntry | null)[][] = [];

  for (const entry of entries) {
    const date = new Date(`${entry.date}T00:00:00`);
    const dayIndex = mondayIndex(date);
    const weekIndex = Math.floor(
      (date.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    weeks[weekIndex] ??= new Array(7).fill(null);
    weeks[weekIndex]![dayIndex] = entry;
  }

  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const firstReal = week.find((cell) => cell !== null);
    if (!firstReal) return null;

    const month = new Date(`${firstReal.date}T00:00:00`).getMonth();
    if (month === lastMonth) return null;

    lastMonth = month;
    return MONTH_LABELS[month];
  });

  return (
    <div className="flex gap-2">
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
          gap: CELL_GAP,
        }}
      >
        {DAY_LABELS.map((label) => (
          <span
            key={label}
            className="flex items-center font-mono text-[10px] text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>

      <div>
        <div
          className="grid grid-flow-col"
          style={{
            gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
            gridAutoColumns: CELL_SIZE,
            gap: CELL_GAP,
          }}
        >
          {weeks.flatMap((week, weekIndex) =>
            week.map((cell, dayIndex) => {
              const ratio = cell ? cell.completed / cell.total : 0;
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    "group relative rounded-[2px] transition-transform hover:z-10 hover:scale-125",
                    cell ? intensityClass(ratio) : "bg-transparent",
                  )}
                >
                  {cell ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                      {formatDate(cell.date)} · {cell.completed}/{cell.total}
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>

        <div
          className="mt-1 grid grid-flow-col"
          style={{ gridAutoColumns: CELL_SIZE, gap: CELL_GAP }}
        >
          {weeks.map((_, weekIndex) => (
            <span
              key={weekIndex}
              className="font-mono text-[10px] text-muted-foreground"
            >
              {monthLabels[weekIndex] ?? ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
