import { SectionStat } from "@/components/ui/section-stat";
import { useNutrition } from "@/features/nutrition/use-nutrition";

export function NutritionPage() {
  const query = useNutrition();

  if (!query.data) return null;

  const { data } = query;

  return (
    <div className="p-4">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest">
          SELF/OS
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Nutrition</h1>
      </header>

      <SectionStat
        label="Today"
        value={`${data.totals.calories.consumed} / ${data.totals.calories.target} KCAL`}
      />

      <SectionStat label="Meals">
        <ul className="space-y-3">
          {data.meals.map((meal) => (
            <li key={meal.id} className="flex items-baseline justify-between">
              <span>{meal.name}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {meal.calories} KCAL
              </span>
            </li>
          ))}
        </ul>
      </SectionStat>
    </div>
  );
}
