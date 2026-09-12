import { Link } from "react-router";

import { ProgressStat } from "@/components/ui/progress";
import type { Status } from "@/data/schemas/status";

type NutritionStatusProps = {
  nutrition: Status["nutrition"];
};

export function NutritionStatus({ nutrition }: NutritionStatusProps) {
  return (
    <Link to="/nutrition" className="mt-8 block space-y-4">
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
  );
}
