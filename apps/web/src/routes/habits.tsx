import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import type { Habit } from "@/data/schemas/habits";
import { HabitDrawer } from "@/features/habits/habit-drawer";
import { isCompletedToday } from "@/features/habits/select-completed-today";
import { selectStreak } from "@/features/habits/select-streak";
import { todayString } from "@/features/habits/today";
import { useHabitEntries } from "@/features/habits/use-habit-entries";
import { useReorderHabits } from "@/features/habits/use-habit-mutations";
import { useHabits } from "@/features/habits/use-habits";
import { useToggleHabitEntry } from "@/features/habits/use-toggle-habit-entry";

export function HabitsPage() {
  const habitsQuery = useHabits();
  const entriesQuery = useHabitEntries();
  const toggle = useToggleHabitEntry();
  const reorder = useReorderHabits();

  const [reordering, setReordering] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  if (!habitsQuery.data || !entriesQuery.data) return null;

  const habits = habitsQuery.data;
  const entries = entriesQuery.data;
  const today = todayString();

  const active = [...habits].filter((h) => h.active).sort((a, b) => a.position - b.position);
  const completed = active.filter((h) => isCompletedToday(entries, h.id, today)).length;

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
    const entry = entries.find((e) => e.habitId === habit.id && e.date === today);
    if (entry) {
      toggle.uncheck.mutate(entry.id);
    } else {
      toggle.check.mutate({ habitId: habit.id, date: today });
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

  return (
    <div className="p-4">
      <div className="mb-8">
        <Header
          eyebrow="SELF/OS"
          title="Habits"
          primary={{
            label: "Complete",
            value: `${completed} / ${active.length}`,
            progress: active.length > 0 ? completed / active.length : 0,
          }}
        />
      </div>

      <SectionStat label="Today">
        <div className="mb-3 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={openAddDrawer}>
            + Add Habit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReordering((r) => !r)}>
            {reordering ? "Done" : "Reorder"}
          </Button>
        </div>

        <ul className="space-y-3">
          {active.map((habit, index) => {
            const done = isCompletedToday(entries, habit.id, today);
            const streak = selectStreak(entries, habit.id, today);

            return (
              <li key={habit.id} className="flex items-center justify-between gap-2">
                {reordering ? (
                  <>
                    <span>{habit.name}</span>
                    <span className="flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => move(habit, -1)}
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={index === active.length - 1}
                        onClick={() => move(habit, 1)}
                      >
                        <ChevronDown />
                      </Button>
                    </span>
                  </>
                ) : (
                  <>
                    <label className="flex min-w-0 items-center gap-2">
                      <input type="checkbox" checked={done} onChange={() => toggleHabit(habit)} />
                      <button
                        type="button"
                        onClick={() => openEditDrawer(habit)}
                        className="truncate text-left"
                      >
                        {habit.name}
                      </button>
                    </label>
                    <span className="font-mono text-sm text-muted-foreground">
                      {streak} day streak
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </SectionStat>

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
