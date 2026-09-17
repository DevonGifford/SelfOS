// PROTOTYPE — Variant A: "Accordion". Exercises grouped as expandable
// cards, each holding a set-by-set table (Strong's classic layout).
// Throwaway. Answers ticket 02 on .scratch/training-feature/map.md.

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import type { Category, Scenario } from "@/features/training-prototype/fixtures";
import { CATEGORY_LABEL, EXERCISES, TEMPLATES, formatSet } from "@/features/training-prototype/fixtures";
import { EmptyBlock, ErrorBlock, LoadingSkeleton } from "@/features/training-prototype/load-states";
import { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

export function VariantA({ scenario }: { scenario: Scenario }) {
  const s = useWorkoutSessionState();
  const [pickedCategory, setPickedCategory] = useState<Category | null>(null);
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);

  if (s.step === "start") {
    if (scenario === "loading") return <LoadingSkeleton />;
    if (scenario === "error") return <ErrorBlock />;

    const templatesForCategory = TEMPLATES.filter((t) => t.category === pickedCategory);

    return (
      <div className="p-4">
        <div className="mb-8">
          <Header eyebrow="SELF/OS" title="Start Workout" />
        </div>

        {scenario === "empty" ? (
          <EmptyBlock />
        ) : (
          <>
            <SectionStat label="Type">
              <div className="flex flex-wrap gap-2">
                {(["push", "pull", "legs", "cardio", "freestyle"] as Category[]).map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={pickedCategory === cat ? "default" : "outline"}
                    onClick={() => setPickedCategory(cat)}
                  >
                    {CATEGORY_LABEL[cat]}
                  </Button>
                ))}
              </div>
            </SectionStat>

            {pickedCategory ? (
              <SectionStat label="Templates">
                <div className="space-y-2">
                  {templatesForCategory.map((tpl) => (
                    <Card key={tpl.id} size="sm">
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{tpl.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tpl.exerciseIds.length} exercises
                          </p>
                        </div>
                        <Button size="sm" onClick={() => s.startFromTemplate(tpl.id)}>
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => s.startFreestyle(pickedCategory)}
                  >
                    Start Freestyle {CATEGORY_LABEL[pickedCategory]} Session
                  </Button>
                </div>
              </SectionStat>
            ) : null}
          </>
        )}
      </div>
    );
  }

  if (s.step === "finished") {
    return <FinishedSummary s={s} />;
  }

  // step === "logging"
  const sessionExercises = EXERCISES.filter((e) => s.exerciseIds.includes(e.id));
  const availableToAdd = EXERCISES.filter((e) => !s.exerciseIds.includes(e.id));

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <Header
          eyebrow="SELF/OS"
          title={s.category ? `${CATEGORY_LABEL[s.category]} Session` : "Session"}
          note={
            <input
              type="text"
              placeholder="+ Add session note"
              value={s.sessionNote}
              onChange={(e) => s.setSessionNote(e.target.value)}
              className="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground focus:text-foreground"
            />
          }
        />
      </div>

      <div className="space-y-3">
        {sessionExercises.map((exercise) => {
          const exerciseSets = s.sets.filter((set) => set.exerciseId === exercise.id);
          const isOpen = openExerciseId === exercise.id || openExerciseId === null;

          return (
            <Card key={exercise.id} size="sm">
              <CardHeader>
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() => setOpenExerciseId(isOpen ? "__none__" : exercise.id)}
                >
                  <CardTitle>{exercise.name}</CardTitle>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {exerciseSets.length} sets
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </span>
                </button>
              </CardHeader>

              {isOpen ? (
                <CardContent>
                  <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_auto_auto] items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
                    <span>#</span>
                    <span>Prev</span>
                    <span>{exercise.type === "cardio" ? "Time" : "Weight"}</span>
                    <span>{exercise.type === "cardio" ? "Dist" : "Reps"}</span>
                    <span>W</span>
                    <span />

                    {exerciseSets.map((set, i) => {
                      const priorSet =
                        exerciseSets[i - 1] ?? s.lastSetFor(exercise.id);
                      return (
                        <SetRow
                          key={set.id}
                          index={i + 1}
                          exercise={exercise}
                          set={set}
                          previousLabel={priorSet ? formatSet(exercise, priorSet) : "—"}
                          onUpdate={(patch) => s.updateSet(set.id, patch)}
                          onRemove={() => s.removeSet(set.id)}
                        />
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => s.addSet(exercise.id)}
                  >
                    + Add Set
                  </Button>
                </CardContent>
              ) : null}
            </Card>
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
          <Button variant="outline" className="w-full" onClick={() => setAddingExercise(true)}>
            + Add Exercise
          </Button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-16 mx-auto max-w-[430px] border-t bg-background p-3">
        <Button className="w-full" onClick={s.finish}>
          Finish Workout
        </Button>
      </div>
    </div>
  );
}

function SetRow({
  index,
  exercise,
  set,
  previousLabel,
  onUpdate,
  onRemove,
}: {
  index: number;
  exercise: { type: "strength" | "cardio" };
  set: { weightKg?: number; reps?: number; durationSec?: number; distanceM?: number; isWarmup: boolean };
  previousLabel: string;
  onUpdate: (patch: Partial<typeof set>) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <span>{index}</span>
      <span className="truncate text-muted-foreground">{previousLabel}</span>
      {exercise.type === "cardio" ? (
        <>
          <input
            type="number"
            value={set.durationSec ? Math.round(set.durationSec / 60) : ""}
            onChange={(e) => onUpdate({ durationSec: Number(e.target.value) * 60 })}
            className="h-7 w-full rounded border bg-transparent px-1 text-foreground"
          />
          <input
            type="number"
            value={set.distanceM ? set.distanceM / 1000 : ""}
            onChange={(e) => onUpdate({ distanceM: Number(e.target.value) * 1000 })}
            className="h-7 w-full rounded border bg-transparent px-1 text-foreground"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            value={set.weightKg ?? ""}
            onChange={(e) => onUpdate({ weightKg: Number(e.target.value) })}
            className="h-7 w-full rounded border bg-transparent px-1 text-foreground"
          />
          <input
            type="number"
            value={set.reps ?? ""}
            onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
            className="h-7 w-full rounded border bg-transparent px-1 text-foreground"
          />
        </>
      )}
      <button
        type="button"
        onClick={() => onUpdate({ isWarmup: !set.isWarmup })}
        className={
          set.isWarmup
            ? "rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-500"
            : "rounded px-1.5 py-0.5 text-[10px] text-muted-foreground/50"
        }
      >
        W
      </button>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
    </>
  );
}

function FinishedSummary({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  return (
    <div className="p-4">
      <div className="mb-8">
        <Header eyebrow="SELF/OS" title="Workout Complete" />
      </div>

      <SectionStat label="Summary" value={`${s.sets.length} sets logged`} />

      <div className="mt-4 space-y-2">
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
