// PROTOTYPE — the single, deepened logging-flow design (Variant A's
// accordion + Variant B's tile start screen, per ticket 02's decision),
// revised after walking through Strong app reference screenshots. Throwaway.
// Answers ticket 02 on .scratch/training-feature/map.md.

import { useEffect, useState } from "react";
import { ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Category, Scenario, SetType } from "@/features/training-prototype/fixtures";
import {
  CATEGORY_LABEL,
  EXERCISES,
  LAST_SESSION_SETS,
  SET_TYPE_BADGE,
  SET_TYPE_LABEL,
  TEMPLATES,
  formatSet,
} from "@/features/training-prototype/fixtures";
import { EmptyBlock, ErrorBlock, LoadingSkeleton } from "@/features/training-prototype/load-states";
import { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

const CATEGORIES: Category[] = ["push", "pull", "legs", "cardio", "freestyle"];

export function TrainingLoggingScreen({ scenario }: { scenario: Scenario }) {
  const s = useWorkoutSessionState();

  if (s.step === "start") return <StartScreen scenario={scenario} onStartTemplate={s.startFromTemplate} onStartFreestyle={s.startFreestyle} />;
  if (s.step === "finished") return <FinishedScreen s={s} />;
  return <LoggingScreen s={s} />;
}

function StartScreen({
  scenario,
  onStartTemplate,
  onStartFreestyle,
}: {
  scenario: Scenario;
  onStartTemplate: (id: string) => void;
  onStartFreestyle: (cat: Category) => void;
}) {
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
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const templates = TEMPLATES.filter((t) => t.category === cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => (templates[0] ? onStartTemplate(templates[0].id) : onStartFreestyle(cat))}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-card ring-1 ring-foreground/10 hover:bg-muted"
              >
                <span className="text-base font-heading uppercase">{CATEGORY_LABEL[cat]}</span>
                <span className="text-xs text-muted-foreground">{templates[0] ? templates[0].name : "Freestyle"}</span>
              </button>
            );
          })}
        </div>
      )}
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

function SessionMenu({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const [open, setOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showTimes, setShowTimes] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border bg-card py-1 text-sm shadow-lg ring-1 ring-foreground/10">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left hover:bg-muted"
            onClick={() => {
              setShowNote((v) => !v);
              setOpen(false);
            }}
          >
            Add note
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left hover:bg-muted"
            onClick={() => {
              setShowTimes((v) => !v);
              setOpen(false);
            }}
          >
            Adjust start/end time
          </button>
        </div>
      ) : null}

      {showNote ? (
        <div className="absolute right-0 top-9 z-10 w-64">
          <textarea
            autoFocus
            value={s.sessionNote}
            onChange={(e) => s.setSessionNote(e.target.value)}
            placeholder="Session note…"
            className="w-full rounded-lg border bg-card p-2 text-sm shadow-lg outline-none"
            rows={2}
          />
        </div>
      ) : null}

      {showTimes ? (
        <div className="absolute right-0 top-9 z-10 w-56 space-y-2 rounded-lg border bg-card p-3 text-sm shadow-lg ring-1 ring-foreground/10">
          <label className="block">
            <span className="text-xs text-muted-foreground">Start</span>
            <input
              type="time"
              defaultValue={s.startedAt ? toTimeInput(s.startedAt) : ""}
              onChange={(e) => {
                const next = fromTimeInput(s.startedAt ?? new Date(), e.target.value);
                s.adjustTimes(next, s.finishedAt);
              }}
              className="mt-1 w-full rounded border bg-transparent px-1.5 py-1"
            />
          </label>
          {s.finishedAt ? (
            <label className="block">
              <span className="text-xs text-muted-foreground">Finish</span>
              <input
                type="time"
                defaultValue={toTimeInput(s.finishedAt)}
                onChange={(e) => {
                  const next = fromTimeInput(s.finishedAt ?? new Date(), e.target.value);
                  s.adjustTimes(s.startedAt ?? new Date(), next);
                }}
                className="mt-1 w-full rounded border bg-transparent px-1.5 py-1"
              />
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">Finish time isn't set until you finish the workout.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function toTimeInput(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function fromTimeInput(base: Date, value: string) {
  const [h, m] = value.split(":").map(Number);
  const next = new Date(base);
  next.setHours(h, m, 0, 0);
  return next;
}

function LoggingScreen({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const elapsed = useElapsed(s.startedAt, s.finishedAt);
  const sessionExercises = EXERCISES.filter((e) => s.exerciseIds.includes(e.id));
  const availableToAdd = EXERCISES.filter((e) => !s.exerciseIds.includes(e.id));
  const [addingExercise, setAddingExercise] = useState(false);
  const [noteEditorFor, setNoteEditorFor] = useState<string | null>(null);

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-3 py-2">
        <button type="button" className="flex size-7 items-center justify-center text-muted-foreground">
          <ChevronDown className="size-5" />
        </button>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{elapsed}</span>
        <Button size="sm" variant="ghost" className="text-primary" onClick={s.finish}>
          Finish
        </Button>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-heading uppercase">
              {s.category ? `${CATEGORY_LABEL[s.category]} Session` : "Session"}
            </h1>
            {s.sessionNote ? <p className="mt-1 text-xs text-muted-foreground">{s.sessionNote}</p> : null}
          </div>
          <SessionMenu s={s} />
        </div>

        <div className="space-y-6">
          {sessionExercises.map((exercise) => {
            const exerciseSets = s.sets.filter((set) => set.exerciseId === exercise.id);
            const hasNote = Boolean(s.exerciseNotes[exercise.id]) || noteEditorFor === exercise.id;

            return (
              <div key={exercise.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-primary">{exercise.name}</span>
                  <button
                    type="button"
                    onClick={() => setNoteEditorFor(noteEditorFor === exercise.id ? null : exercise.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                {hasNote ? (
                  <input
                    type="text"
                    autoFocus={noteEditorFor === exercise.id}
                    value={s.exerciseNotes[exercise.id] ?? ""}
                    onChange={(e) => s.setExerciseNote(exercise.id, e.target.value)}
                    placeholder="Note for this exercise…"
                    className="mb-2 w-full rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                ) : null}

                <div className="grid grid-cols-[1.75rem_1fr_1fr_1fr_auto] items-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase text-muted-foreground">
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
                          previousLabel={priorSet ? formatSet(exercise, priorSet) : "—"}
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

          {addingExercise ? (
            <Card size="sm">
              <CardContent className="space-y-1">
                {availableToAdd.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      s.addExercise(e.id);
                      setAddingExercise(false);
                    }}
                  >
                    {e.name}
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            <button
              type="button"
              className="block text-xs font-medium uppercase tracking-wide text-primary"
              onClick={() => setAddingExercise(true)}
            >
              + Add Exercise
            </button>
          )}

          <button type="button" className="block text-xs font-medium uppercase tracking-wide text-destructive" onClick={s.cancelSession}>
            Cancel Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function SetRow({
  exercise,
  set,
  rowLabel,
  previousLabel,
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
  previousLabel: string;
  onUpdate: (patch: Partial<typeof set>) => void;
  onSetType: (t: SetType) => void;
  onToggleConfirmed: () => void;
  onRemove: () => void;
}) {
  const badgeColor =
    set.setType === "warmup"
      ? "text-amber-500"
      : set.setType === "failure"
        ? "text-red-500"
        : set.setType === "drop"
          ? "text-violet-400"
          : "text-foreground";

  return (
    <>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span className={`pointer-events-none text-xs font-semibold ${badgeColor}`}>{rowLabel}</span>
        <select
          aria-label="Set type"
          value={set.setType}
          onChange={(e) => onSetType(e.target.value as SetType)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {(["working", "warmup", "drop", "failure"] as SetType[]).map((t) => (
            <option key={t} value={t}>
              {SET_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </span>

      <span className="truncate text-muted-foreground">{previousLabel}</span>

      {exercise.type === "cardio" ? (
        <>
          <input
            type="number"
            value={set.durationSec ? Math.round(set.durationSec / 60) : ""}
            onChange={(e) => onUpdate({ durationSec: Number(e.target.value) * 60 })}
            className="h-8 w-full rounded-lg border bg-transparent px-1.5 text-sm text-foreground"
          />
          <input
            type="number"
            value={set.distanceM ? set.distanceM / 1000 : ""}
            onChange={(e) => onUpdate({ distanceM: Number(e.target.value) * 1000 })}
            className="h-8 w-full rounded-lg border bg-transparent px-1.5 text-sm text-foreground"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            value={set.weightKg ?? ""}
            onChange={(e) => onUpdate({ weightKg: Number(e.target.value) })}
            className="h-8 w-full rounded-lg border bg-transparent px-1.5 text-sm text-foreground"
          />
          <input
            type="number"
            value={set.reps ?? ""}
            onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
            className="h-8 w-full rounded-lg border bg-transparent px-1.5 text-sm text-foreground"
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
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </>
  );
}

function FinishedScreen({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const elapsed = useElapsed(s.startedAt, s.finishedAt);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-heading uppercase">Workout Complete</h1>
        <SessionMenu s={s} />
      </div>

      <p className="text-sm text-muted-foreground">
        {s.sets.filter((set) => set.confirmed).length} sets logged · {elapsed}
      </p>

      <div className="mt-6 space-y-2">
        <Button
          className="w-full"
          variant={s.savedAsTemplate ? "secondary" : "outline"}
          onClick={s.saveAsTemplate}
          disabled={s.savedAsTemplate}
        >
          {s.savedAsTemplate ? "Saved as Template ✓" : "Save as Template"}
        </Button>
        <Button className="w-full" onClick={s.reset}>
          Done
        </Button>
      </div>
    </div>
  );
}
