import { DemoDataBadge } from "@/components/ui/demo-data-badge";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import { useHabits } from "@/features/habits/use-habits";

export function HabitsPage() {
  const query = useHabits();

  if (!query.data) return null;

  const { data } = query;
  const completed = data.filter((habit) => habit.completedToday).length;

  return (
    <div className="p-4">
      <div className="mb-8">
        <Header
          eyebrow="SELF/OS"
          badge={<DemoDataBadge domain="habits" />}
          title="Habits"
          primary={{
            label: "Complete",
            value: `${completed} / ${data.length}`,
            progress: data.length > 0 ? completed / data.length : 0,
          }}
        />
      </div>

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
