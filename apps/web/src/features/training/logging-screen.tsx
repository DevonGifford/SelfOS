import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { ExerciseMenu } from "@/features/training/exercise-menu";
import { ExercisePicker } from "@/features/training/exercise-picker";
import { SESSION_TYPE_LABEL } from "@/features/training/labels";
import { NoteEditorDialog, NotePreview } from "@/features/training/note-field";
import { RestTimer } from "@/features/training/rest-timer";
import { SET_TYPE_BADGE } from "@/features/training/set-format";
import { SetRow } from "@/features/training/set-row";
import { SessionMenu } from "@/features/training/session-menu";
import { useCreateExercise, useExercises } from "@/features/training/use-exercises";
import {
  useAddSessionExercise,
  useRemoveSessionExercise,
  useReorderSessionExercises,
  useReplaceSessionExercise,
  useSessionExercises,
  useUpdateSessionExerciseNote,
} from "@/features/training/use-session-exercises";
import { useLastSetsForExercise } from "@/features/training/use-last-sets";
import {
  useCancelWorkoutSession,
  useFinishWorkoutSession,
  useUpdateWorkoutSession,
} from "@/features/training/use-workout-sessions";
import { useCreateWorkoutSet, useDeleteWorkoutSet, useUpdateWorkoutSet, useWorkoutSets } from "@/features/training/use-workout-sets";
import type { Exercise } from "@/data/schemas/exercises";
import type { SetType, WorkoutType } from "@/data/schemas/training-shared";
import type { WorkoutSession, WorkoutSessionExercise } from "@/data/schemas/workout-sessions";

function useElapsed(startedAt: string, finishedAt: string | null) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (finishedAt) return;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [finishedAt]);

  const end = finishedAt ? new Date(finishedAt) : new Date();
  const totalSeconds = Math.max(0, Math.floor((end.getTime() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Add Exercise / Replace exercise share one picker: which slot (if any)
// we're replacing decides what onSelect does with the chosen exercise.
type PickerMode = { kind: "add" } | { kind: "replace"; sessionExerciseId: string } | null;

export function LoggingScreen({
  session,
  onFinished,
}: {
  session: WorkoutSession;
  onFinished: (sessionId: string) => void;
}) {
  const elapsed = useElapsed(session.createdAt, session.finishedAt);
  const sessionExercisesQuery = useSessionExercises(session.id);
  const exercisesQuery = useExercises();
  const createExercise = useCreateExercise();
  const addSessionExercise = useAddSessionExercise(session.id);
  const reorderSessionExercises = useReorderSessionExercises(session.id);
  const replaceSessionExercise = useReplaceSessionExercise(session.id);
  const removeSessionExercise = useRemoveSessionExercise(session.id);
  const updateSessionExerciseNote = useUpdateSessionExerciseNote(session.id);
  const updateSession = useUpdateWorkoutSession();
  const finishSession = useFinishWorkoutSession();
  const cancelSession = useCancelWorkoutSession();

  const [picker, setPicker] = useState<PickerMode>(null);
  // null = closed, "session" = editing the session note, a session-exercise
  // id = editing that row's note. One dialog instance, one note workflow.
  const [noteEditorFor, setNoteEditorFor] = useState<string | "session" | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});

  const sessionExercises = sessionExercisesQuery.data ?? [];
  const usedExerciseIds = new Set(sessionExercises.map((se) => se.exerciseId).filter((id): id is string => id !== null));
  const availableToAdd = (exercisesQuery.data ?? []).filter((e) => !usedExerciseIds.has(e.id));
  const exerciseWorkoutType = session.workoutType === "freestyle" ? null : session.workoutType;

  function selectFromPicker(exercise: Exercise) {
    if (picker?.kind === "replace") {
      replaceSessionExercise.mutate({ id: picker.sessionExerciseId, exerciseId: exercise.id });
    } else {
      addSessionExercise.mutate(exercise.id);
    }
  }

  function createFromPicker(name: string, workoutType: WorkoutType) {
    createExercise.mutate(
      { name, type: "strength", workoutType },
      { onSuccess: (created) => selectFromPicker(created) },
    );
  }

  function moveExercise(sessionExerciseId: string, direction: -1 | 1) {
    const index = sessionExercises.findIndex((se) => se.id === sessionExerciseId);
    const swapWith = index + direction;
    if (index === -1 || swapWith < 0 || swapWith >= sessionExercises.length) return;
    const next = [...sessionExercises];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    reorderSessionExercises.mutate(next.map((se) => se.id));
  }

  if (sessionExercisesQuery.isPending) return null;

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-3 py-2">
        <button
          type="button"
          className="flex size-7 items-center justify-center text-muted-foreground"
          onClick={() => window.scrollTo({ top: 0 })}
        >
          <ChevronDown className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <RestTimer />
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{elapsed}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-primary"
          onClick={() => finishSession.mutate(session.id, { onSuccess: () => onFinished(session.id) })}
        >
          Finish
        </Button>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-heading uppercase">{SESSION_TYPE_LABEL[session.workoutType]} Session</h1>
            <NotePreview note={session.note ?? ""} onClick={() => setNoteEditorFor("session")} className="mt-1" />
          </div>
          <SessionMenu
            session={session}
            onAddNote={() => setNoteEditorFor("session")}
            onAdjustTimes={(startedAt, finishedAt) =>
              updateSession.mutate({
                id: session.id,
                startedAt,
                ...(finishedAt ? { finishedAt } : {}),
              })
            }
          />
        </div>

        <div className="space-y-6">
          {sessionExercises.map((se, index) => (
            <ExerciseBlock
              key={se.id}
              sessionExercise={se}
              exercises={exercisesQuery.data ?? []}
              sessionWorkoutType={session.workoutType}
              index={index}
              total={sessionExercises.length}
              note={exerciseNotes[se.id] ?? se.note ?? ""}
              onMove={(direction) => moveExercise(se.id, direction)}
              onAddNote={() => setNoteEditorFor(se.id)}
              onReplace={() => setPicker({ kind: "replace", sessionExerciseId: se.id })}
              onRemove={() => removeSessionExercise.mutate(se.id)}
            />
          ))}
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
                <AlertDialogAction variant="destructive" onClick={() => cancelSession.mutate(session.id)}>
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
        workoutType={exerciseWorkoutType}
        onSelect={(exercise) => {
          selectFromPicker(exercise);
          setPicker(null);
        }}
        onCreate={(name, workoutType) => {
          createFromPicker(name, workoutType);
          setPicker(null);
        }}
      />

      <NoteEditorDialog
        open={noteEditorFor !== null}
        onOpenChange={(open) => {
          if (!open) setNoteEditorFor(null);
        }}
        title={
          noteEditorFor === "session"
            ? "Session note"
            : `${sessionExercises.find((se) => se.id === noteEditorFor)?.exerciseName ?? "Exercise"} note`
        }
        value={
          noteEditorFor === "session"
            ? (session.note ?? "")
            : noteEditorFor
              ? (exerciseNotes[noteEditorFor] ?? sessionExercises.find((se) => se.id === noteEditorFor)?.note ?? "")
              : ""
        }
        onSave={(value) => {
          if (noteEditorFor === "session") {
            updateSession.mutate({ id: session.id, note: value });
          } else if (noteEditorFor) {
            setExerciseNotes((notes) => ({ ...notes, [noteEditorFor]: value }));
            updateSessionExerciseNote.mutate({ id: noteEditorFor, note: value });
          }
        }}
      />
    </div>
  );
}

function ExerciseBlock({
  sessionExercise,
  exercises,
  sessionWorkoutType,
  index,
  total,
  note,
  onMove,
  onAddNote,
  onReplace,
  onRemove,
}: {
  sessionExercise: WorkoutSessionExercise;
  exercises: Exercise[];
  sessionWorkoutType: WorkoutSession["workoutType"];
  index: number;
  total: number;
  note: string;
  onMove: (direction: -1 | 1) => void;
  onAddNote: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const setsQuery = useWorkoutSets(sessionExercise.id);
  const lastSetsQuery = useLastSetsForExercise(sessionExercise.exerciseId, sessionWorkoutType);
  const createSet = useCreateWorkoutSet();
  const updateSet = useUpdateWorkoutSet();
  const deleteSet = useDeleteWorkoutSet();

  const exercise = exercises.find((e) => e.id === sessionExercise.exerciseId);
  const exerciseType = exercise?.type ?? "strength";
  const sets = setsQuery.data ?? [];
  const history = lastSetsQuery.data ?? [];

  function addSet() {
    const previousInSession = sets[sets.length - 1];
    const fallback = history[history.length - 1];
    const source = previousInSession ?? fallback;
    createSet.mutate({
      sessionExerciseId: sessionExercise.id,
      setType: "working",
      weightKg: exerciseType === "strength" ? (source?.weightKg ?? null) : null,
      reps: exerciseType === "strength" ? (source?.reps ?? null) : null,
      durationSec: exerciseType === "cardio" ? (source?.durationSec ?? null) : null,
      distanceM: exerciseType === "cardio" ? (source?.distanceM ?? null) : null,
    });
  }

  function addWarmupSet() {
    createSet.mutate({ sessionExerciseId: sessionExercise.id, setType: "warmup" });
  }

  const rowLabels = sets.reduce<string[]>((labels, set) => {
    const workingCount = labels.filter((_, j) => sets[j]?.setType === "working").length;
    labels.push(set.setType === "working" ? String(workingCount + 1) : SET_TYPE_BADGE[set.setType]);
    return labels;
  }, []);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-primary">{sessionExercise.exerciseName}</span>
        <ExerciseMenu
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMoveUp={() => onMove(-1)}
          onMoveDown={() => onMove(1)}
          onAddNote={onAddNote}
          onAddWarmupSet={addWarmupSet}
          onReplace={onReplace}
          onRemove={onRemove}
        />
      </div>

      <NotePreview note={note} onClick={onAddNote} className="mb-1" />

      <div className="grid grid-cols-[1.25rem_1fr_3.25rem_3.25rem_auto] items-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase text-muted-foreground">
        <span>Set</span>
        <span>Previous</span>
        <span>{exerciseType === "cardio" ? "Time" : "Weight"}</span>
        <span>{exerciseType === "cardio" ? "Dist" : "Reps"}</span>
        <span />

        {/* "Previous" is positional — row N's previous is last time's row
            N, matching Strong, not "the row before this one in today's
            list." */}
        {sets.map((set, i) => {
          const priorSet = history[i] ?? history[history.length - 1];
          const rowLabel = rowLabels[i];
          return (
            <SetRow
              key={set.id}
              exerciseType={exerciseType}
              set={set}
              rowLabel={rowLabel}
              priorSet={priorSet}
              onUpdate={(patch) =>
                updateSet.mutate({ id: set.id, sessionExerciseId: sessionExercise.id, ...patch })
              }
              onSetType={(t: SetType) =>
                updateSet.mutate({ id: set.id, sessionExerciseId: sessionExercise.id, setType: t })
              }
              onToggleConfirmed={() =>
                updateSet.mutate({ id: set.id, sessionExerciseId: sessionExercise.id, confirmed: !set.confirmed })
              }
              onRemove={() => deleteSet.mutate({ id: set.id, sessionExerciseId: sessionExercise.id })}
            />
          );
        })}
      </div>

      <button type="button" className="mt-2 text-xs font-medium uppercase tracking-wide text-primary" onClick={addSet}>
        + Add Set
      </button>
    </div>
  );
}
