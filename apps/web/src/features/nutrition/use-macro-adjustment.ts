import { useState } from "react";

export type MacroKey = "calories" | "protein" | "carbs" | "fat";

export type MacroRates = Record<MacroKey, number>;

export const MACRO_STEPS: Record<MacroKey, number> = { calories: 10, protein: 1, carbs: 1, fat: 1 };

// Shared quantity + per-macro nudge state, used by both the Add flow
// (adjusting before a FoodEntry exists) and the Edit flow (adjusting one
// that already does) — the two are otherwise identical arithmetic over a
// different starting point. baseRates is the per-serving (or per-1x) rate:
// the selected/linked Food's values, or an orphaned entry's own derived
// rate when there's no Food to ask.
export function useMacroAdjustment(baseRates: MacroRates, initialQuantity: number) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [offsets, setOffsets] = useState<MacroRates>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  function nudgeQuantity(delta: number) {
    setQuantity((q) => Math.max(0.5, Math.round((q + delta) * 10) / 10));
  }

  function nudgeMacro(key: MacroKey, delta: number) {
    setOffsets((prev) => ({ ...prev, [key]: prev[key] + delta }));
  }

  function resolvedMacros() {
    return {
      quantity,
      calories: Math.round(baseRates.calories * quantity) + offsets.calories,
      protein: Math.round(baseRates.protein * quantity) + offsets.protein,
      carbs: Math.round(baseRates.carbs * quantity) + offsets.carbs,
      fat: Math.round(baseRates.fat * quantity) + offsets.fat,
    };
  }

  return { quantity, nudgeQuantity, nudgeMacro, resolvedMacros };
}
