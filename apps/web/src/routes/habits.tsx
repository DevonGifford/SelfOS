import { SectionStat } from "@/components/ui/section-stat";
import { useHabits } from "@/features/habits/use-habits";

export function HabitsPage() {
  const query = useHabits();

  if (!query.data) return null;

  const { data } = query;

  return (
    <div className="p-4">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest">
          SELF/OS
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Habits</h1>
      </header>

      <SectionStat label="Today">
        <ul className="space-y-3">
          {data.map((habit) => (
            <li key={habit.id} className="flex items-baseline justify-between">
              <span>
                {habit.name}
                {habit.completedToday ? " ✓" : ""}
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {habit.streak} day streak
              </span>
            </li>
          ))}
        </ul>
      </SectionStat>
    </div>
  );
}
