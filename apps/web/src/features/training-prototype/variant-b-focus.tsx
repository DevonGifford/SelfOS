// PROTOTYPE — Variant B: "Single-Set Focus". Fullscreen, one exercise at a
// time, big touch targets and steppers for mid-set gym use. Throwaway.
// Answers ticket 02 on .scratch/training-feature/map.md.

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import type { Category, LoggedSet, Scenario } from "@/features/training-prototype/fixtures";
import { CATEGORY_LABEL, EXERCISES, TEMPLATES, formatSet } from "@/features/training-prototype/fixtures";
import { EmptyBlock, ErrorBlock, LoadingSkeleton } from "@/features/training-prototype/load-states";
import { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

const CATEGORIES: Category[] = ["push", "pull", "legs", "cardio", "freestyle"];

export function VariantB({ scenario }: { scenario: Scenario }) {
  const s = useWorkoutSessionState();

  if (s.step === "start") {
    if (scenario === "loading") return <LoadingSkeleton />;
    if (scenario === "error") return <ErrorBlock />;

    return (
      <div className="p-4">
        <div className="mb-8">
          <Header eyebrow="SELF/OS" title="Start Workout" />
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
                  onClick={() => {
                    if (templates[0]) s.startFromTemplate(templates[0].id);
                    else s.startFreestyle(cat);
                  }}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-card ring-1 ring-foreground/10 hover:bg-muted"
                >
                  <span className="text-base font-heading uppercase">{CATEGORY_LABEL[cat]}</span>
                  <span className="text-xs text-muted-foreground">
                    {templates[0] ? templates[0].name : "Freestyle"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (s.step === "finished") {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
          ✓
        </div>
        <h1 className="text-xl font-heading uppercase">Workout Complete</h1>
        <p className="text-sm text-muted-foreground">{s.sets.length} sets logged</p>

        <div className="mt-4 w-full space-y-2">
          <Button
            size="lg"
            className="w-full"
            variant={s.savedAsTemplate ? "secondary" : "outline"}
            onClick={s.saveAsTemplate}
            disabled={s.savedAsTemplate}
          >
            {s.savedAsTemplate ? "Saved as Template ✓" : "Save as Template"}
          </Button>
          <Button size="lg" className="w-full" onClick={s.reset}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return <FocusLogger s={s} />;
}

function FocusLogger({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const sessionExercises = EXERCISES.filter((e) => s.exerciseIds.includes(e.id));
  const availableToAdd = EXERCISES.filter((e) => !s.exerciseIds.includes(e.id));
  const [activeId, setActiveId] = useState<string | null>(sessionExercises[0]?.id ?? null);
  const [picking, setPicking] = useState(sessionExercises.length === 0);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const exercise = EXERCISES.find((e) => e.id === activeId);
  const suggested = activeId ? s.suggestedFor(activeId) : undefined;
  const doneCount = s.sets.filter((set) => set.exerciseId === activeId).length;

  const [weight, setWeight] = useState(suggested?.weightKg ?? 20);
  const [reps, setReps] = useState(suggested?.reps ?? 8);
  const [warmup, setWarmup] = useState(false);

  function pick(id: string) {
    s.addExercise(id);
    setActiveId(id);
    setPicking(false);
    const sug = s.suggestedFor(id);
    setWeight(sug?.weightKg ?? 20);
    setReps(sug?.reps ?? 8);
  }

  function logSet() {
    if (!activeId) return;
    const patch: Partial<LoggedSet> =
      exercise?.type === "cardio"
        ? { durationSec: weight * 60, distanceM: reps * 100 }
        : { weightKg: weight, reps };
    s.addSet(activeId, { ...patch, isWarmup: warmup, note: note || undefined });
    setWarmup(false);
    setNote("");
    setShowNote(false);
  }

  if (picking || !exercise) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <Header eyebrow="SELF/OS" title="Pick Exercise" />
        </div>
        <div className="space-y-2">
          {availableToAdd.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => pick(e.id)}
              className="block w-full rounded-lg border bg-card px-4 py-3 text-left text-sm ring-1 ring-foreground/10 hover:bg-muted"
            >
              {e.name}
            </button>
          ))}
        </div>
        {sessionExercises.length > 0 ? (
          <Button variant="ghost" className="mt-4 w-full" onClick={() => setPicking(false)}>
            Cancel
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-[80dvh] flex-col p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="text-left text-lg font-heading uppercase"
        >
          {exercise.name}
        </button>
        <Button size="sm" variant="outline" onClick={s.finish}>
          Finish
        </Button>
      </div>

      <div className="mt-1 flex items-center gap-1">
        {Array.from({ length: Math.max(doneCount, 1) }).map((_, i) => (
          <span
            key={i}
            className={`size-2 rounded-full ${i < doneCount ? "bg-primary" : "bg-muted"}`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Set {doneCount + 1}</span>
      </div>

      {suggested ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Last time: {formatSet(exercise, suggested)}
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-muted-foreground">No history for this exercise yet</p>
      )}

      <div className="mt-6 flex flex-1 flex-col justify-center gap-6">
        <Stepper
          label={exercise.type === "cardio" ? "Minutes" : "Weight (kg)"}
          value={weight}
          onChange={setWeight}
          step={exercise.type === "cardio" ? 1 : 2.5}
        />
        <Stepper
          label={exercise.type === "cardio" ? "Distance (×100m)" : "Reps"}
          value={reps}
          onChange={setReps}
          step={1}
        />
      </div>

      <button
        type="button"
        onClick={() => setWarmup((w) => !w)}
        className={`mt-2 rounded-full px-4 py-2 text-center text-sm font-medium ${
          warmup ? "bg-amber-500/20 text-amber-500" : "border text-muted-foreground"
        }`}
      >
        {warmup ? "Warm-up Set ✓" : "Mark as Warm-up"}
      </button>

      {showNote ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for this set…"
          className="mt-2 w-full rounded-lg border bg-transparent p-2 text-sm outline-none"
          rows={2}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="mt-2 text-left text-xs text-muted-foreground underline underline-offset-2"
        >
          + Add note
        </button>
      )}

      <Button size="lg" className="mt-4 w-full" onClick={logSet}>
        Log Set →
      </Button>

      {s.sets.length > 0 ? (
        <Card size="sm" className="mt-4">
          <CardContent>
            <p className="mb-1 font-mono text-xs uppercase text-muted-foreground">
              This session — {s.sets.length} sets
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - step))}
          className="flex size-12 items-center justify-center rounded-full border text-lg hover:bg-muted"
        >
          <Minus className="size-5" />
        </button>
        <span className="w-20 text-center text-3xl font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="flex size-12 items-center justify-center rounded-full border text-lg hover:bg-muted"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
