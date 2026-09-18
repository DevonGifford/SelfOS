import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { WORKOUT_TYPE_LABEL } from "@/features/training/labels";
import { useWorkoutTemplateSets } from "@/features/training/use-workout-templates";
import type { WorkoutType } from "@/data/schemas/training-shared";
import type { WorkoutTemplate } from "@/data/schemas/workout-templates";

function TemplateExerciseCount({ templateId }: { templateId: string }) {
  const { data } = useWorkoutTemplateSets(templateId);
  if (!data) return null;
  const count = new Set(data.map((s) => s.exerciseId ?? s.exerciseName)).size;
  return <span className="block text-xs text-muted-foreground">{count} exercises</span>;
}

// "How do you want to start this Workout Type" sheet — a Base UI Drawer,
// matching the app's own bottom-sheet pattern.
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
  templates: WorkoutTemplate[];
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
              <div className="flex w-full items-center justify-between rounded-xl border bg-card p-3 ring-1 ring-foreground/10">
                <span>
                  <span className="block font-medium">{defaultTemplate.name}</span>
                  <TemplateExerciseCount templateId={defaultTemplate.id} />
                </span>
                <Button size="sm" onClick={() => onSelectTemplate(defaultTemplate.id)}>
                  Start
                </Button>
              </div>
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
                      <TemplateExerciseCount templateId={tpl.id} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!defaultTemplate && alternates.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No templates yet for {WORKOUT_TYPE_LABEL[workoutType]}.
            </p>
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
