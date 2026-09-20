import { Button } from "@/components/ui/button";
import { MACRO_STEPS, type MacroKey } from "@/features/nutrition/use-macro-adjustment";

const MACRO_LABELS: Record<MacroKey, string> = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};
const MACRO_UNITS: Record<MacroKey, string> = { calories: "", protein: "g", carbs: "g", fat: "g" };

type MacroAdjustmentFieldsProps = {
  servingLabel: string;
  quantity: number;
  macros: Record<MacroKey, number>;
  onNudgeQuantity: (delta: number) => void;
  onNudgeMacro: (key: MacroKey, delta: number) => void;
  quantityError?: string;
};

// Quantity stepper + per-macro adjustment rows — the shared visual and
// interaction core of both the Add flow (before a FoodEntry exists) and
// the Edit flow (adjusting one that already does).
export function MacroAdjustmentFields({
  servingLabel,
  quantity,
  macros,
  onNudgeQuantity,
  onNudgeMacro,
  quantityError,
}: MacroAdjustmentFieldsProps) {
  return (
    <>
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Quantity ({servingLabel})
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onNudgeQuantity(-0.5)}
            aria-label="Decrease quantity"
          >
            &minus;
          </Button>
          <span className="flex-1 text-center text-sm">{quantity.toFixed(1)}</span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onNudgeQuantity(0.5)}
            aria-label="Increase quantity"
          >
            +
          </Button>
        </div>
        {quantityError && <p className="mt-1 text-xs text-destructive">{quantityError}</p>}
      </div>

      <div className="border-t pt-4">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Manual macro adjustment
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {(Object.keys(MACRO_LABELS) as MacroKey[]).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 text-xs text-muted-foreground">{MACRO_LABELS[key]}</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => onNudgeMacro(key, -MACRO_STEPS[key])}
                aria-label={`Decrease ${MACRO_LABELS[key]}`}
              >
                &minus;
              </Button>
              <span className="flex-1 text-center text-sm">
                {macros[key]}
                {MACRO_UNITS[key]}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => onNudgeMacro(key, MACRO_STEPS[key])}
                aria-label={`Increase ${MACRO_LABELS[key]}`}
              >
                +
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
