import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WORKOUT_TYPE_LABEL } from "@/features/training/labels";
import {
  useArchiveWorkoutTemplate,
  useRestoreWorkoutTemplate,
  useSetDefaultWorkoutTemplate,
  useWorkoutTemplates,
} from "@/features/training/use-workout-templates";
import type { WorkoutType } from "@/data/schemas/training-shared";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

// Template archive/restore/default management — "Training Settings →
// Templates". A Dialog rather than its own route.
export function TemplateManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const templatesQuery = useWorkoutTemplates();
  const archiveMutation = useArchiveWorkoutTemplate();
  const restoreMutation = useRestoreWorkoutTemplate();
  const setDefaultMutation = useSetDefaultWorkoutTemplate();

  const templates = templatesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Training Templates</DialogTitle>
        </DialogHeader>

        {archiveMutation.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {archiveMutation.error.message}
          </p>
        ) : null}

        <div className="space-y-5">
          {WORKOUT_TYPES.map((type) => {
            const active = templates.filter((t) => t.workoutType === type && !t.archived);
            const archived = templates.filter((t) => t.workoutType === type && t.archived);

            return (
              <div key={type}>
                <p className="mb-1.5 font-mono text-xs uppercase text-muted-foreground">
                  {WORKOUT_TYPE_LABEL[type]}
                </p>
                <ul className="space-y-1">
                  {active.map((tpl) => (
                    <li key={tpl.id} className="flex items-center justify-between rounded-lg border px-2.5 py-1.5">
                      <span className="flex items-center gap-2 text-sm">
                        {tpl.name}
                        {tpl.isDefault ? (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary">
                            Default
                          </span>
                        ) : null}
                      </span>
                      <span className="flex items-center gap-1">
                        {!tpl.isDefault ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDefaultMutation.mutate(tpl.id)}
                          >
                            Make default
                          </Button>
                        ) : null}
                        <Button size="xs" variant="ghost" onClick={() => archiveMutation.mutate(tpl.id)}>
                          Archive
                        </Button>
                      </span>
                    </li>
                  ))}
                  {active.length === 0 ? (
                    <li className="rounded-lg border border-dashed px-2.5 py-2 text-center text-xs text-muted-foreground">
                      No templates yet
                    </li>
                  ) : null}
                </ul>

                {archived.length > 0 ? (
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] text-muted-foreground">Archived</p>
                    <ul className="space-y-1">
                      {archived.map((tpl) => (
                        <li
                          key={tpl.id}
                          className="flex items-center justify-between rounded-lg border border-dashed px-2.5 py-1.5 text-muted-foreground"
                        >
                          <span className="text-sm">{tpl.name}</span>
                          <Button size="xs" variant="ghost" onClick={() => restoreMutation.mutate(tpl.id)}>
                            Restore
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
