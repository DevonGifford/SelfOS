import { useState } from "react";

import { Header } from "@/components/ui/header";
import { ErrorBlock, LoadingSkeleton } from "@/features/training/load-states";
import { SESSION_TYPE_LABEL, WORKOUT_TYPE_LABEL, WORKOUT_TYPE_SUBTITLE } from "@/features/training/labels";
import { StartWorkoutPicker } from "@/features/training/start-workout-picker";
import { TemplateManager } from "@/features/training/template-manager";
import { useCreateWorkoutSession } from "@/features/training/use-workout-sessions";
import { useWorkoutTemplates } from "@/features/training/use-workout-templates";
import type { WorkoutType } from "@/data/schemas/training-shared";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

export function StartScreen() {
  const templatesQuery = useWorkoutTemplates();
  const createSession = useCreateWorkoutSession();
  const [pickerFor, setPickerFor] = useState<WorkoutType | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);

  if (templatesQuery.isPending) return <LoadingSkeleton />;
  if (templatesQuery.isError) return <ErrorBlock />;

  const templatesForPicker = pickerFor
    ? templatesQuery.data.filter((t) => t.workoutType === pickerFor)
    : [];

  return (
    <div className="p-4">
      <div className="mb-6">
        <Header eyebrow="SELF/OS" title="Start Workout" />
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {WORKOUT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPickerFor(type)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-card p-2 text-center ring-1 ring-foreground/10 hover:bg-muted"
            >
              <span className="text-base font-heading uppercase">{WORKOUT_TYPE_LABEL[type]}</span>
              <span className="text-[11px] text-muted-foreground">{WORKOUT_TYPE_SUBTITLE[type]}</span>
            </button>
          ))}
        </div>

        {/* Freestyle means exactly "start a blank session" — it skips the
            picker sheet entirely, since a Template can never belong to
            Freestyle. */}
        <button
          type="button"
          onClick={() => createSession.mutate({ workoutType: "freestyle" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-center hover:bg-muted"
        >
          <span className="font-heading uppercase">{SESSION_TYPE_LABEL.freestyle}</span>
          <span className="text-xs text-muted-foreground">Start an empty workout</span>
        </button>
      </div>

      <StartWorkoutPicker
        open={pickerFor !== null}
        onOpenChange={(open) => {
          if (!open) setPickerFor(null);
        }}
        workoutType={pickerFor}
        templates={templatesForPicker}
        onSelectTemplate={(templateId) => {
          const type = pickerFor;
          setPickerFor(null);
          if (type) createSession.mutate({ workoutType: type, templateId });
        }}
        onStartEmpty={() => {
          if (pickerFor) createSession.mutate({ workoutType: pickerFor });
          setPickerFor(null);
        }}
        onManageTemplates={() => {
          setPickerFor(null);
          setManagerOpen(true);
        }}
      />

      <TemplateManager open={managerOpen} onOpenChange={setManagerOpen} />
    </div>
  );
}
