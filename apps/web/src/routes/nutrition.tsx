import { useState } from "react";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import type { FoodEntry } from "@/data/schemas/food-entries";
import { selectNutritionTargets } from "@/features/configuration/select-nutrition-targets";
import { useConfiguration } from "@/features/configuration/use-configuration";
import { EntryDrawer } from "@/features/nutrition/entry-drawer";
import { FoodDrawer } from "@/features/nutrition/food-drawer";
import { selectDailyTotals } from "@/features/nutrition/select-daily-totals";
import { selectMealGroups } from "@/features/nutrition/select-meal-groups";
import { useDeleteFoodEntry } from "@/features/nutrition/use-food-entry-mutations";
import { useFoodEntries } from "@/features/nutrition/use-food-entries";
import { useFoods } from "@/features/nutrition/use-foods";
import { todayString } from "@/lib/date";
import { useOpenAddFromQuery } from "@/lib/use-open-add-from-query";

function macroProgress(consumed: number, target: number) {
  return target > 0 ? Math.max(0, Math.min(consumed / target, 1)) : 0;
}

export function NutritionPage() {
  const entriesQuery = useFoodEntries();
  const foodsQuery = useFoods();
  const configQuery = useConfiguration();
  const deleteMutation = useDeleteFoodEntry();

  const [addOpen, setAddOpen] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);

  useOpenAddFromQuery(openAddDrawer);

  if (!entriesQuery.data || !foodsQuery.data || !configQuery.data) return null;

  const entries = entriesQuery.data;
  const foods = foodsQuery.data;
  const today = todayString();

  const data = selectDailyTotals(entries, today, selectNutritionTargets(configQuery.data));
  const todaysEntries = entries.filter((entry) => entry.date === today);

  function openAddDrawer() {
    setAddOpen(true);
    setAddKey((key) => key + 1);
  }

  function openEditDrawer(entry: FoodEntry) {
    setEditingEntry(entry);
    setEditOpen(true);
    setEditKey((key) => key + 1);
  }

  return (
    <div className="p-4">
      <Header
        eyebrow="SELF/OS"
        title="Nutrition"
        subtitle="Today"
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
        note={
          <Button size="sm" variant="outline" onClick={openAddDrawer}>
            + Add Food
          </Button>
        }
      />

      <SectionStat label="Today's Meals">
        <div className="flex flex-col gap-4">
          {selectMealGroups(todaysEntries).map((group) => (
            <div key={group.slot}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditDrawer(entry)}
                      className="flex min-w-0 flex-1 items-baseline justify-between gap-2 py-2 text-left"
                    >
                      <span className="truncate">
                        {entry.name}
                        {entry.quantity !== 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">{entry.quantity}x</span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-sm text-muted-foreground">
                        {entry.calories} KCAL
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-lg"
                            variant="ghost"
                            aria-label={`Actions for ${entry.name}`}
                          />
                        }
                      >
                        <EllipsisVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto min-w-40">
                        <DropdownMenuItem onClick={() => openEditDrawer(entry)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(entry.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionStat>

      <FoodDrawer key={addKey} open={addOpen} onOpenChange={setAddOpen} foods={foods} date={today} />

      {editingEntry && (
        <EntryDrawer
          key={editKey}
          open={editOpen}
          onOpenChange={setEditOpen}
          entry={editingEntry}
          foods={foods}
        />
      )}
    </div>
  );
}
