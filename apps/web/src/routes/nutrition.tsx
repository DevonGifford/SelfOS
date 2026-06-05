import { DemoDataBadge } from "@/components/ui/demo-data-badge";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import { useNutrition } from "@/features/nutrition/use-nutrition";
import { StatusNutrition } from "@/features/status/nutrition";

function macroProgress(consumed: number, target: number) {
  return target > 0 ? Math.max(0, Math.min(consumed / target, 1)) : 0;
}

export function NutritionPage() {
  const query = useNutrition();

  if (!query.data) return null;

  const { data } = query;

  return (
    <div className="p-4">
      <Header
        eyebrow="SELF/OS"
        badge={<DemoDataBadge domain="nutrition" />}
        title="Nutrition"
        subtitle="Write something"
        note={
          <p className="font-mono text-xs italic font-thin text-muted-foreground">
            todo/ either quote or warning message
          </p>
        }
        primary={{
          label: "Calories",
          value: data.totals.calories.consumed.toLocaleString(),
          progress: macroProgress(data.totals.calories.consumed, data.totals.calories.target),
        }}
        secondary={{
          label: "Protein",
          value: `${data.totals.protein.consumed}g`,
          progress: macroProgress(data.totals.protein.consumed, data.totals.protein.target),
        }}
      />

      <StatusNutrition nutrition={data.totals} />


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
