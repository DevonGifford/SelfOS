// PROTOTYPE — the single, deepened logging-flow design (Variant A's
// accordion + Variant B's tile start screen, per ticket 02's decision),
// revised after walking through Strong app reference screenshots, then
// refined again against shadcn primitives (menus, dialogs, command palette)
// in place of hand-rolled ones. Throwaway. Answers ticket 02 on
// .scratch/training-feature/map.md.

import { useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { Exercise, LoggedSet, Scenario, SetType, WorkoutType } from "@/features/training-prototype/fixtures";
import {
  LAST_SESSION_SETS,
  SESSION_TYPE_LABEL,
  SET_TYPE_BADGE,
  SET_TYPE_COLOR,
  SET_TYPE_LABEL,
  WORKOUT_TYPE_LABEL,
  WORKOUT_TYPE_SUBTITLE,
  formatSetBase,
} from "@/features/training-prototype/fixtures";
import { ExerciseMenu } from "@/features/training-prototype/exercise-menu";
import { ExercisePicker } from "@/features/training-prototype/exercise-picker";
import { EmptyBlock, ErrorBlock, LoadingSkeleton } from "@/features/training-prototype/load-states";
import { NoteEditorDialog, NotePreview } from "@/features/training-prototype/note-field";
import { RestTimer } from "@/features/training-prototype/rest-timer";
import { SaveTemplateDialog } from "@/features/training-prototype/save-template-dialog";
import { SessionMenu } from "@/features/training-prototype/session-menu";
import { StartWorkoutPicker } from "@/features/training-prototype/start-workout-picker";
import { TemplateManager } from "@/features/training-prototype/template-manager";
import { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

const WORKOUT_TYPES: WorkoutType[] = ["push", "pull", "legs", "cardio"];

export function TrainingLoggingScreen({ scenario }: { scenario: Scenario }) {
  const s = useWorkoutSessionState();

  if (s.step === "start") return <StartScreen scenario={scenario} s={s} />;
  if (s.step === "finished") return <FinishedScreen s={s} />;
  return <LoggingScreen s={s} />;
}

function StartScreen({ scenario, s }: { scenario: Scenario; s: ReturnType<typeof useWorkoutSessionState> }) {
  const [pickerFor, setPickerFor] = useState<WorkoutType | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);

  if (scenario === "loading") return <LoadingSkeleton />;
  if (scenario === "error") return <ErrorBlock />;

  return (
    <div className="p-4">
      <div className="mb-6">
        <p className="font-mono text-xs italic uppercase tracking-widest text-muted-foreground">SELF/OS</p>
        <h1 className="text-xl font-heading uppercase">Start Workout</h1>
      </div>

      {scenario === "empty" ? (
        <EmptyBlock />
      ) : (
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

          {/* Freestyle is semantically different — not a peer tile. It
              means exactly "start a blank session," so it skips the
              picker sheet entirely (there's nothing to pick from — a
              Template can never belong to Freestyle). */}
          <button
            type="button"
            onClick={() => s.startEmpty("freestyle")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-center hover:bg-muted"
          >
            <span className="font-heading uppercase">{SESSION_TYPE_LABEL.freestyle}</span>
            <span className="text-xs text-muted-foreground">Start an empty workout</span>
          </button>
        </div>
      )}

      <StartWorkoutPicker
        open={pickerFor !== null}
        onOpenChange={(open) => {
          if (!open) setPickerFor(null);
        }}
        workoutType={pickerFor}
        templates={pickerFor ? s.templatesFor(pickerFor) : []}
        onSelectTemplate={(id) => {
          setPickerFor(null);
          s.startFromTemplate(id);
        }}
        onStartEmpty={() => {
          if (pickerFor) s.startEmpty(pickerFor);
          setPickerFor(null);
        }}
        onManageTemplates={() => {
          setPickerFor(null);
          setManagerOpen(true);
        }}
      />

      <TemplateManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        templates={s.templates}
        onArchive={s.archiveTemplate}
        onRestore={s.restoreTemplate}
        onSetDefault={s.setDefaultTemplate}
      />
    </div>
  );
}

function useElapsed(startedAt: Date | null, finishedAt: Date | null) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (finishedAt) return;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [finishedAt]);

  if (!startedAt) return "0:00";
  const end = finishedAt ?? new Date();
  const totalSeconds = Math.max(0, Math.floor((end.getTime() - startedAt.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Add Exercise / Replace exercise share one picker: which slot (if any)
// we're replacing decides what onSelect does with the chosen exercise.
type PickerMode = { kind: "add" } | { kind: "replace"; exerciseId: string } | null;

function LoggingScreen({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const elapsed = useElapsed(s.startedAt, s.finishedAt);
  // Ordered by exerciseIds (insertion order), not catalog order — otherwise
  // a newly-added exercise wouldn't reliably land at the bottom.
  const sessionExercises = s.exerciseIds
    .map((id) => s.allExercises.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e));
  const availableToAdd = s.allExercises.filter((e) => !s.exerciseIds.includes(e.id));
  const [picker, setPicker] = useState<PickerMode>(null);
  // null = closed, "session" = editing the session note, an exercise id =
  // editing that exercise's note. One dialog instance, one note workflow.
  const [noteEditorFor, setNoteEditorFor] = useState<string | "session" | null>(null);

  function selectFromPicker(exercise: Exercise) {
    if (picker?.kind === "replace") s.replaceExercise(picker.exerciseId, exercise.id);
    else s.addExercise(exercise.id);
  }

  function createFromPicker(name: string) {
    const exercise = s.createExercise(name);
    selectFromPicker(exercise);
  }

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-3 py-2">
        <button type="button" className="flex size-7 items-center justify-center text-muted-foreground">
          <ChevronDown className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <RestTimer />
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{elapsed}</span>
        </div>
        <Button size="sm" variant="ghost" className="text-primary" onClick={s.finish}>
          Finish
        </Button>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-heading uppercase">
              {s.workoutType ? `${SESSION_TYPE_LABEL[s.workoutType]} Session` : "Session"}
            </h1>
            <NotePreview note={s.sessionNote} onClick={() => setNoteEditorFor("session")} className="mt-1" />
          </div>
          <SessionMenu s={s} onAddNote={() => setNoteEditorFor("session")} />
        </div>

        <div className="space-y-6">
          {sessionExercises.map((exercise, index) => {
            const exerciseSets = s.sets.filter((set) => set.exerciseId === exercise.id);
            const displayName = s.exerciseNameOverrides[exercise.id] ?? exercise.name;

            return (
              <div key={exercise.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-primary">{displayName}</span>
                  <ExerciseMenu
                    exerciseName={displayName}
                    canMoveUp={index > 0}
                    canMoveDown={index < sessionExercises.length - 1}
                    onMoveUp={() => s.moveExercise(exercise.id, -1)}
                    onMoveDown={() => s.moveExercise(exercise.id, 1)}
                    onAddNote={() => setNoteEditorFor(exercise.id)}
                    onAddWarmupSet={() => s.addSet(exercise.id, { setType: "warmup", confirmed: false })}
                    onReplace={() => setPicker({ kind: "replace", exerciseId: exercise.id })}
                    onRename={(name) => s.renameExercise(exercise.id, name)}
                    onRemove={() => s.removeExercise(exercise.id)}
                  />
                </div>

                <NotePreview
                  note={s.exerciseNotes[exercise.id] ?? ""}
                  onClick={() => setNoteEditorFor(exercise.id)}
                  className="mb-1"
                />

                <div className="grid grid-cols-[1.25rem_1fr_3.25rem_3.25rem_auto] items-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase text-muted-foreground">
                  <span>Set</span>
                  <span>Previous</span>
                  <span>{exercise.type === "cardio" ? "Time" : "Weight"}</span>
                  <span>{exercise.type === "cardio" ? "Dist" : "Reps"}</span>
                  <span />

                  {(() => {
                    // "Previous" is positional — row N's previous is last
                    // time's row N, matching Strong, not "the row before
                    // this one in today's list" (those are usually the
                    // same sequence right after seeding from a template,
                    // but diverge the moment sets are added/reordered).
                    const history = LAST_SESSION_SETS[exercise.id] ?? [];
                    let workingCount = 0;
                    return exerciseSets.map((set, i) => {
                      const priorSet = history[i] ?? history[history.length - 1];
                      if (set.setType === "working") workingCount += 1;
                      const rowLabel = set.setType === "working" ? String(workingCount) : SET_TYPE_BADGE[set.setType];
                      return (
                        <SetRow
                          key={set.id}
                          exercise={exercise}
                          set={set}
                          rowLabel={rowLabel}
                          priorSet={priorSet}
                          onUpdate={(patch) => s.updateSet(set.id, patch)}
                          onSetType={(t) => s.setSetType(set.id, t)}
                          onToggleConfirmed={() => s.toggleConfirmed(set.id)}
                          onRemove={() => s.removeSet(set.id)}
                        />
                      );
                    });
                  })()}
                </div>

                <button
                  type="button"
                  className="mt-2 text-xs font-medium uppercase tracking-wide text-primary"
                  onClick={() => s.addSet(exercise.id)}
                >
                  + Add Set
                </button>
              </div>
            );
          })}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="text-xs font-medium uppercase tracking-wide text-primary"
            onClick={() => setPicker({ kind: "add" })}
          >
            + Add Exercise
          </button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<button type="button" className="text-xs font-medium uppercase tracking-wide text-destructive" />}
            >
              Cancel Workout
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  The current session, including every logged set, will be discarded. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Workout</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={s.cancelSession}>
                  Cancel Workout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <ExercisePicker
        open={picker !== null}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
        title={picker?.kind === "replace" ? "Replace exercise" : "Add exercise"}
        options={availableToAdd}
        onSelect={selectFromPicker}
        onCreate={createFromPicker}
      />

      <NoteEditorDialog
        open={noteEditorFor !== null}
        onOpenChange={(open) => {
          if (!open) setNoteEditorFor(null);
        }}
        title={
          noteEditorFor === "session"
            ? "Session note"
            : `${sessionExercises.find((e) => e.id === noteEditorFor)?.name ?? "Exercise"} note`
        }
        value={
          noteEditorFor === "session" ? s.sessionNote : noteEditorFor ? (s.exerciseNotes[noteEditorFor] ?? "") : ""
        }
        onSave={(value) => {
          if (noteEditorFor === "session") s.setSessionNote(value);
          else if (noteEditorFor) s.setExerciseNote(noteEditorFor, value);
        }}
      />
    </div>
  );
}

function SetRow({
  exercise,
  set,
  rowLabel,
  priorSet,
  onUpdate,
  onSetType,
  onToggleConfirmed,
  onRemove,
}: {
  exercise: { type: "strength" | "cardio" };
  set: {
    id: string;
    setType: SetType;
    confirmed: boolean;
    weightKg?: number;
    reps?: number;
    durationSec?: number;
    distanceM?: number;
  };
  rowLabel: string;
  priorSet: LoggedSet | undefined;
  onUpdate: (patch: Partial<typeof set>) => void;
  onSetType: (t: SetType) => void;
  onToggleConfirmed: () => void;
  onRemove: () => void;
}) {
  const priorBadge = priorSet ? SET_TYPE_BADGE[priorSet.setType] : "";

  return (
    <>
      {/* Lightweight, not a full editor: tapping the set indicator itself
          opens a small menu to reclassify it. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<button type="button" className="-ml-0.5 flex h-7 w-5 items-center justify-center" />}
        >
          <span className={`text-xs font-semibold ${SET_TYPE_COLOR[set.setType]}`}>{rowLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(["working", "warmup", "drop", "failure"] as SetType[]).map((t) => (
            <DropdownMenuItem key={t} className="whitespace-nowrap" onClick={() => onSetType(t)}>
              <span className={`w-4 font-semibold ${SET_TYPE_COLOR[t]}`}>{SET_TYPE_BADGE[t] || "•"}</span>
              {SET_TYPE_LABEL[t]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="truncate text-muted-foreground normal-case">
        {priorSet ? (
          <>
            {formatSetBase(exercise, priorSet)}
            {priorBadge ? <span className={`ml-1 ${SET_TYPE_COLOR[priorSet.setType]}`}>[{priorBadge}]</span> : null}
          </>
        ) : (
          "—"
        )}
      </span>

      {exercise.type === "cardio" ? (
        <>
          <input
            type="number"
            value={set.durationSec ? Math.round(set.durationSec / 60) : ""}
            onChange={(e) => onUpdate({ durationSec: Number(e.target.value) * 60 })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
          <input
            type="number"
            value={set.distanceM ? set.distanceM / 1000 : ""}
            onChange={(e) => onUpdate({ distanceM: Number(e.target.value) * 1000 })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            value={set.weightKg ?? ""}
            onChange={(e) => onUpdate({ weightKg: Number(e.target.value) })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
          <input
            type="number"
            value={set.reps ?? ""}
            onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
        </>
      )}

      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleConfirmed}
          aria-pressed={set.confirmed}
          className={
            set.confirmed
              ? "flex size-7 items-center justify-center rounded-md bg-emerald-500 text-white"
              : "flex size-7 items-center justify-center rounded-md border text-muted-foreground"
          }
        >
          ✓
        </button>
        <AlertDialog>
          <AlertDialogTrigger render={<button type="button" className="text-muted-foreground hover:text-destructive" />}>
            <Trash2 className="size-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete set?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onRemove}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
    </>
  );
}

function FinishedScreen({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const elapsed = useElapsed(s.startedAt, s.finishedAt);
  const [noteOpen, setNoteOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateOutcome, setTemplateOutcome] = useState<string | null>(null);

  const sourceTemplate = s.templateId ? s.templates.find((t) => t.id === s.templateId) : undefined;
  // A real Workout Type locks the Save Template form's Type field; a
  // Freestyle session has none of its own to inherit (Templates can never
  // belong to Freestyle), so that form asks instead.
  const fixedWorkoutType = s.workoutType && s.workoutType !== "freestyle" ? s.workoutType : null;

  function handleUpdateSource() {
    const result = s.updateSourceTemplate();
    if (result.ok && sourceTemplate) setTemplateOutcome(`Updated "${sourceTemplate.name}"`);
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-heading uppercase">Workout Complete</h1>
        <SessionMenu s={s} onAddNote={() => setNoteOpen(true)} />
      </div>

      <p className="text-sm text-muted-foreground">
        {s.sets.filter((set) => set.confirmed).length} sets logged · {elapsed}
      </p>

      <NotePreview note={s.sessionNote} onClick={() => setNoteOpen(true)} className="mt-1" />

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

        <Button className="w-full" onClick={s.reset}>
          Done
        </Button>
      </div>

      <NoteEditorDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="Session note"
        value={s.sessionNote}
        onSave={s.setSessionNote}
      />

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        fixedWorkoutType={fixedWorkoutType}
        onSave={(type, name) => {
          const result = s.saveSessionAsNewTemplate(type, name);
          if (result.ok) setTemplateOutcome(`Saved as new template "${name.trim()}"`);
          return result;
        }}
      />
    </div>
  );
}
