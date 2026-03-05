import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/ui/header";
import { Separator } from "@/components/ui/separator";
import { toastManager } from "@/components/ui/toast";
import type { Habit } from "@/data/schemas/habits";
import { HabitDrawer } from "@/features/habits/habit-drawer";
import { isCompletedToday } from "@/features/habits/select-completed-today";
import { selectStreak } from "@/features/habits/select-streak";
import { useHabitEntries } from "@/features/habits/use-habit-entries";
import { useReorderHabits, useUpdateHabit } from "@/features/habits/use-habit-mutations";
import { useHabits } from "@/features/habits/use-habits";
import { useToggleHabitEntry } from "@/features/habits/use-toggle-habit-entry";
import { validateActiveChange } from "@/features/habits/validate";
import { todayString } from "@/lib/date";
import { useOpenAddFromQuery } from "@/lib/use-open-add-from-query";

const MAX_DAYS_BACK = 7;

function dateWithOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return todayString(d);
}

export function HabitsPage() {
  const habitsQuery = useHabits();
  const entriesQuery = useHabitEntries();
  const toggle = useToggleHabitEntry();
  const reorder = useReorderHabits();
  const update = useUpdateHabit();

  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [dayOffset, setDayOffset] = useState(0);

  useOpenAddFromQuery(openAddDrawer);

  if (!habitsQuery.data || !entriesQuery.data) return null;

  const habits = habitsQuery.data;
  const entries = entriesQuery.data;

  const isToday = dayOffset === 0;
  const viewedDate = dateWithOffset(dayOffset);
  const dateLabel = new Date(`${viewedDate}T00:00:00`)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();

  const active = [...habits].filter((h) => h.active).sort((a, b) => a.position - b.position);
  const completed = active.filter((h) => isCompletedToday(entries, h.id, viewedDate)).length;

  function goToPrevDay() {
    if (dayOffset <= -MAX_DAYS_BACK) return;
    setDayOffset((o) => o - 1);
  }

  function goToNextDay() {
    if (isToday) return;
    setDayOffset((o) => o + 1);
  }

  function openAddDrawer() {
    setEditingHabit(undefined);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  function openEditDrawer(habit: Habit) {
    setEditingHabit(habit);
    setDrawerOpen(true);
    setDrawerKey((key) => key + 1);
  }

  function toggleHabit(habit: Habit) {
    const entry = entries.find((e) => e.habitId === habit.id && e.date === viewedDate);
    if (entry) {
      toggle.uncheck.mutate(entry.id);
    } else {
      toggle.check.mutate({ habitId: habit.id, date: viewedDate });
    }
  }

  function move(habit: Habit, direction: -1 | 1) {
    const index = active.findIndex((h) => h.id === habit.id);
    const swapWith = active[index + direction];
    if (!swapWith) return;

    const reordered = [...active];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    reorder.mutate(reordered.map((h) => h.id));
  }

  function archiveHabit(habit: Habit) {
    const errors = validateActiveChange(false, habit.active, active.length);
    if (errors.active) {
      toastManager.add({ title: errors.active, timeout: 4000 });
      return;
    }
    update.mutate({ id: habit.id, input: { active: false } });
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col p-4">
      <div className="shrink-0">
        <div className="mb-4">
          <Header
            eyebrow="SELF/OS"
            title="Habits"
            primary={{
              label: "Complete",
              value: `${completed} / ${active.length}`,
              progress: active.length > 0 ? completed / active.length : 0,
            }}
            note={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openAddDrawer} aria-label="Add habit">
                  + Habit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing((e) => !e)}
                  aria-label={editing ? undefined : "Edit habits"}
                >
                  {editing ? "Done" : "Edit"}
                </Button>
              </div>
            }
          />
        </div>

        {!editing && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={goToPrevDay}
                disabled={dayOffset <= -MAX_DAYS_BACK}
                aria-label="Previous day"
              >
                <ChevronLeft />
              </Button>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                {isToday ? "Today" : dateLabel}
              </p>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={goToNextDay}
                disabled={isToday}
                aria-label="Next day"
              >
                <ChevronRight />
              </Button>
            </div>
            {!isToday && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setDayOffset(0)}
                aria-label="Jump to today"
              >
                Today
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain border-t pt-4">
        {editing && (
          <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Habits</p>
        )}
        <ul className="space-y-1">
          {active.map((habit, index) => {
            const done = isCompletedToday(entries, habit.id, viewedDate);
            const streak = selectStreak(entries, habit.id, viewedDate);

            return (
              <li key={habit.id} className="flex items-center justify-between gap-2">
                {editing ? (
                  <>
                    <span className="min-w-0 flex-1 truncate py-2">{habit.name}</span>
                    <span className="flex items-center gap-1">
                      <Button
                        size="icon-lg"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => move(habit, -1)}
                        aria-label="Move up"
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size="icon-lg"
                        variant="ghost"
                        disabled={index === active.length - 1}
                        onClick={() => move(habit, 1)}
                        aria-label="Move down"
                      >
                        <ChevronDown />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon-lg"
                              variant="ghost"
                              aria-label={`Actions for ${habit.name}`}
                            />
                          }
                        >
                          <EllipsisVertical />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto min-w-40">
                          <DropdownMenuItem onClick={() => openEditDrawer(habit)}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => archiveHabit(habit)}
                          >
                            Archive habit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </>
                ) : (
                  <>
                    <label className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleHabit(habit)}
                        className="size-4 shrink-0"
                      />
                      <span className="truncate">{habit.name}</span>
                    </label>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {streak} day streak
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {editing && (
          <>
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start" onClick={openAddDrawer}>
              + Add Habit
            </Button>
          </>
        )}
      </div>

      <HabitDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        habit={editingHabit}
        habits={habits}
      />
    </div>
  );
}
