import { Select } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { MEAL_SLOTS, type MealSlot } from "@/data/schemas/food-entries";

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  snack: "Snack",
  lunch: "Lunch",
  tea: "Tea",
  dinner: "Dinner",
};

type MealSlotSelectProps = {
  value: MealSlot;
  onChange: (slot: MealSlot) => void;
};

// Compact Nutrition-domain control for the five fixed meal slots — used at
// log time (FoodDrawer) and reusable wherever else a meal slot needs
// picking (e.g. a future Food Entry edit flow), rather than the
// space-hungry pill row it replaces.
export function MealSlotSelect({ value, onChange }: MealSlotSelectProps) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Meal</p>
      <Select.Root value={value} onValueChange={(next) => onChange(next as MealSlot)}>
        <Select.Trigger className="mt-1 flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm outline-none data-[popup-open]:border-foreground">
          <Select.Value>{(slot: MealSlot) => MEAL_SLOT_LABELS[slot]}</Select.Value>
          <Select.Icon className="text-muted-foreground">
            <ChevronDownIcon className="size-4" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="isolate z-50 outline-none" sideOffset={4}>
            <Select.Popup className="z-50 min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              {MEAL_SLOTS.map((slot) => (
                <Select.Item
                  key={slot}
                  value={slot}
                  className="flex cursor-default items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <Select.ItemText>{MEAL_SLOT_LABELS[slot]}</Select.ItemText>
                  <Select.ItemIndicator>
                    <CheckIcon className="size-3.5" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
