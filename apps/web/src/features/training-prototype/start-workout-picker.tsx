// PROTOTYPE — "how do you want to start this Workout Type" sheet. Tapping
// Push/Pull/Legs/Cardio no longer immediately creates a session; this is
// what opens instead. A Base UI Drawer, matching the real app's own
// bottom-sheet pattern (features/habits/habit-drawer.tsx) rather than
// inventing a prototype-only pattern. Answers ticket 04 on
// .scratch/training-feature/map.md.

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { Template, WorkoutType } from "@/features/training-prototype/fixtures";
import { WORKOUT_TYPE_LABEL } from "@/features/training-prototype/fixtures";

export function StartWorkoutPicker({
  open,
  onOpenChange,
  workoutType,
  templates,
  onSelectTemplate,
  onStartEmpty,
  onManageTemplates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutType: WorkoutType | null;
  templates: Template[];
  onSelectTemplate: (templateId: string) => void;
  onStartEmpty: () => void;
  onManageTemplates: () => void;
}) {
  if (!workoutType) return null;

  const active = templates.filter((t) => !t.archived);
  const defaultTemplate = active.find((t) => t.isDefault);
  const alternates = active.filter((t) => !t.isDefault);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle swipeDirection="down">
      <DrawerContent className="mx-auto max-w-[430px]">
        <DrawerHeader>
          <DrawerTitle className="uppercase">Start {WORKOUT_TYPE_LABEL[workoutType]}</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto p-4">
          {defaultTemplate ? (
            <div>
              <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Default</p>
              <button
                type="button"
                onClick={() => onSelectTemplate(defaultTemplate.id)}
                className="flex w-full items-center justify-between rounded-xl border bg-card p-3 text-left ring-1 ring-foreground/10 hover:bg-muted"
              >
                <span>
                  <span className="block font-medium">{defaultTemplate.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {defaultTemplate.exerciseIds.length} exercises
                  </span>
                </span>
                <Button size="sm" onClick={() => onSelectTemplate(defaultTemplate.id)}>
                  Start
                </Button>
              </button>
            </div>
          ) : null}

          {alternates.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Saved Templates</p>
              <div className="space-y-2">
                {alternates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelectTemplate(tpl.id)}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-muted"
                  >
                    <span>
                      <span className="block text-sm font-medium">{tpl.name}</span>
                      <span className="block text-xs text-muted-foreground">{tpl.exerciseIds.length} exercises</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={onStartEmpty}>
            + Start empty {WORKOUT_TYPE_LABEL[workoutType]} workout
          </Button>
          <button
            type="button"
            onClick={onManageTemplates}
            className="text-center text-xs text-muted-foreground underline underline-offset-2"
          >
            Manage Templates
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
