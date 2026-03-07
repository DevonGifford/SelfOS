import { Link } from "react-router";

import { ProgressStat } from "@/components/ui/progress";
import type { Status } from "@/data/schemas/status";
import { StatusSection } from "@/features/status/status-section";

type StatusNutritionProps = {
  nutrition: Status["nutrition"];
};

// No visible heading — the calorie/macro bars are already self-explanatory
// — so StatusSection renders titleless here (a lone corner chevron).
export function StatusNutrition({ nutrition }: StatusNutritionProps) {
  return (
    <StatusSection bordered={false} className="mt-4">
      <Link to="/nutrition" className="block space-y-0.5">
        <ProgressStat
          label="Calories"
          value={nutrition.calories.consumed}
          max={nutrition.calories.target}
        />
        <ProgressStat
          label="Protein"
          value={nutrition.protein.consumed}
          max={nutrition.protein.target}
        />
        <ProgressStat
          label="Carbs"
          value={nutrition.carbs.consumed}
          max={nutrition.carbs.target}
        />
        <ProgressStat label="Fat" value={nutrition.fat.consumed} max={nutrition.fat.target} />
      </Link>
    </StatusSection>
  );
}
