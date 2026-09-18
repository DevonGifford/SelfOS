import { useState } from "react";

import { Button } from "@/components/ui/button";
import { NoteEditorDialog, NotePreview } from "@/features/training/note-field";
import { SaveTemplateDialog } from "@/features/training/save-template-dialog";
import { SessionMenu } from "@/features/training/session-menu";
import { useSessionExercises } from "@/features/training/use-session-exercises";
import { useUpdateSourceTemplate, useUpdateWorkoutSession } from "@/features/training/use-workout-sessions";
import { useWorkoutTemplates } from "@/features/training/use-workout-templates";
import { useSessionSets } from "@/features/training/use-workout-sets";
import type { WorkoutSession } from "@/data/schemas/workout-sessions";

export function FinishedScreen({ session, onDone }: { session: WorkoutSession; onDone: () => void }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateOutcome, setTemplateOutcome] = useState<string | null>(null);

  const templatesQuery = useWorkoutTemplates();
  const sessionExercisesQuery = useSessionExercises(session.id);
  const sessionExerciseIds = (sessionExercisesQuery.data ?? []).map((se) => se.id);
  const { bySessionExerciseId } = useSessionSets(sessionExerciseIds);
  const updateSession = useUpdateWorkoutSession();
  const updateSourceTemplate = useUpdateSourceTemplate();

  const sourceTemplate = session.templateId
    ? templatesQuery.data?.find((t) => t.id === session.templateId)
    : undefined;
  // A real Workout Type locks the Save Template form's Type field; a
  // Freestyle session has none of its own to inherit (Templates can never
  // belong to Freestyle), so that form asks instead.
  const fixedWorkoutType = session.workoutType !== "freestyle" ? session.workoutType : null;

  const setsLoggedCount = sessionExerciseIds.reduce(
    (total, id) => total + (bySessionExerciseId.get(id) ?? []).filter((set) => set.confirmed).length,
    0,
  );

  const durationSeconds = session.finishedAt
    ? Math.max(0, Math.floor((Date.parse(session.finishedAt) - Date.parse(session.createdAt)) / 1000))
    : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  function handleUpdateSource() {
    updateSourceTemplate.mutate(session.id, {
      onSuccess: () => {
        if (sourceTemplate) setTemplateOutcome(`Updated "${sourceTemplate.name}"`);
      },
    });
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-heading uppercase">Workout Complete</h1>
        <SessionMenu
          session={session}
          onAddNote={() => setNoteOpen(true)}
          onAdjustTimes={(startedAt, finishedAt) =>
            updateSession.mutate({ id: session.id, startedAt, ...(finishedAt ? { finishedAt } : {}) })
          }
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {setsLoggedCount} sets logged · {minutes}:{seconds.toString().padStart(2, "0")}
      </p>

      <NotePreview note={session.note ?? ""} onClick={() => setNoteOpen(true)} className="mt-1" />

      {/* This session is already saved to history unconditionally — has
          been since it started (ADR 0003). Everything below only affects
          Templates, never the historical record of what happened. */}
      <div className="mt-6 space-y-2">
        {templateOutcome ? (
          <p className="rounded-lg border bg-muted/50 p-2 text-center text-xs text-muted-foreground">
            {templateOutcome} ✓
          </p>
        ) : (
          <>
            {sourceTemplate ? (
              <Button variant="outline" className="w-full" onClick={handleUpdateSource}>
                Update "{sourceTemplate.name}"
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={() => setSaveTemplateOpen(true)}>
              Save as New Template
            </Button>
          </>
        )}

        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>

      <NoteEditorDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="Session note"
        value={session.note ?? ""}
        onSave={(value) => updateSession.mutate({ id: session.id, note: value })}
      />

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        sessionId={session.id}
        fixedWorkoutType={fixedWorkoutType}
        onSaved={(name) => setTemplateOutcome(`Saved as new template "${name}"`)}
      />
    </div>
  );
}

