// PROTOTYPE — Variant C: "Quick-Add Feed". Sets append to a flat running
// feed; a pinned quick-add bar stays visible so nothing needs expanding.
// Throwaway. Answers ticket 02 on .scratch/training-feature/map.md.

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import type { Category, LoggedSet, Scenario } from "@/features/training-prototype/fixtures";
import { CATEGORY_LABEL, EXERCISES, TEMPLATES, formatSet } from "@/features/training-prototype/fixtures";
import { EmptyBlock, ErrorBlock, LoadingSkeleton } from "@/features/training-prototype/load-states";
import { useWorkoutSessionState } from "@/features/training-prototype/use-workout-session-state";

const CATEGORIES: Category[] = ["push", "pull", "legs", "cardio", "freestyle"];

export function VariantC({ scenario }: { scenario: Scenario }) {
  const s = useWorkoutSessionState();
  const [category, setCategory] = useState<Category>("push");
  const [templateId, setTemplateId] = useState<string | null>(null);

  if (s.step === "start") {
    if (scenario === "loading") return <LoadingSkeleton />;
    if (scenario === "error") return <ErrorBlock />;

    const templatesForCategory = TEMPLATES.filter((t) => t.category === category);

    return (
      <div className="p-4">
        <div className="mb-8">
          <Header eyebrow="SELF/OS" title="Training" />
        </div>

        {scenario === "empty" ? (
          <EmptyBlock />
        ) : (
          <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Type</p>
            <div className="flex overflow-hidden rounded-lg border">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setTemplateId(null);
                  }}
                  className={`flex-1 px-1 py-1.5 text-xs ${
                    category === cat ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>

            {templatesForCategory.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {templatesForCategory.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      templateId === tpl.id ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            ) : null}

            <Button
              className="mt-4 w-full"
              onClick={() => (templateId ? s.startFromTemplate(templateId) : s.startFreestyle(category))}
            >
              Start
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (s.step === "finished") {
    return (
      <div className="p-4">
        <div className="rounded-xl border bg-card p-4 text-center ring-1 ring-foreground/10">
          <p className="font-heading uppercase">Session Saved</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.sets.length} sets logged</p>
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
      </div>
    );
  }

  return <FeedLogger s={s} />;
}

function FeedLogger({ s }: { s: ReturnType<typeof useWorkoutSessionState> }) {
  const sessionExercises = EXERCISES.filter((e) => s.exerciseIds.includes(e.id));
  const [filter, setFilter] = useState<string | "all">("all");
  const [pickerOpen, setPickerOpen] = useState(sessionExercises.length === 0);
  const [quickExerciseId, setQuickExerciseId] = useState<string | null>(sessionExercises[0]?.id ?? null);

  const quickExercise = EXERCISES.find((e) => e.id === quickExerciseId);
  const suggested = quickExerciseId ? s.suggestedFor(quickExerciseId) : undefined;
  const [weight, setWeight] = useState(suggested?.weightKg ?? 20);
  const [reps, setReps] = useState(suggested?.reps ?? 8);
  const [warmup, setWarmup] = useState(false);

  const feed = [...s.sets].reverse().filter((set) => filter === "all" || set.exerciseId === filter);
  const availableToAdd = EXERCISES.filter((e) => !s.exerciseIds.includes(e.id));

  function selectQuickExercise(id: string) {
    s.addExercise(id);
    setQuickExerciseId(id);
    setPickerOpen(false);
    const sug = s.suggestedFor(id);
    setWeight(sug?.weightKg ?? 20);
    setReps(sug?.reps ?? 8);
  }

  function quickAdd() {
    if (!quickExerciseId || !quickExercise) return;
    const patch: Partial<LoggedSet> =
      quickExercise.type === "cardio"
        ? { durationSec: weight * 60, distanceM: reps * 100 }
        : { weightKg: weight, reps };
    s.addSet(quickExerciseId, { ...patch, isWarmup: warmup });
    setWarmup(false);
  }

  return (
    <div className="flex min-h-[85dvh] flex-col p-4 pb-40">
      <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between bg-background/95 px-4 py-2 backdrop-blur">
        <Header
          eyebrow="SELF/OS"
          title={s.category ? `${CATEGORY_LABEL[s.category]} Session` : "Session"}
        />
        <Button size="sm" variant="outline" onClick={s.finish}>
          Finish
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-2.5 py-1 text-xs ${filter === "all" ? "border-primary bg-primary/10" : ""}`}
        >
          All
        </button>
        {sessionExercises.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setFilter(e.id)}
            className={`rounded-full border px-2.5 py-1 text-xs ${filter === e.id ? "border-primary bg-primary/10" : ""}`}
          >
            {e.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground"
        >
          + Add Exercise
        </button>
      </div>

      {pickerOpen ? (
        <div className="mb-3 space-y-1 rounded-lg border p-2">
          {availableToAdd.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => selectQuickExercise(e.id)}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              {e.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex-1 space-y-1.5">
        {feed.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing logged yet — use the bar below</p>
        ) : (
          feed.map((set) => {
            const ex = EXERCISES.find((e) => e.id === set.exerciseId)!;
            return (
              <div
                key={set.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{ex.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatSet(ex, set)}</span>
                  {set.isWarmup ? (
                    <span className="rounded bg-amber-500/20 px-1 text-[10px] text-amber-500">W</span>
                  ) : null}
                  {set.note ? <span className="text-xs text-muted-foreground">📝</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => s.removeSet(set.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {quickExercise ? (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-[430px] border-t bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <select
              value={quickExerciseId ?? ""}
              onChange={(e) => selectQuickExercise(e.target.value)}
              className="h-7 rounded border bg-transparent px-1 text-sm"
            >
              {sessionExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {suggested ? (
              <span className="text-xs text-muted-foreground">Last: {formatSet(quickExercise, suggested)}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="h-8 w-16 rounded border bg-transparent px-1.5 text-sm"
              aria-label={quickExercise.type === "cardio" ? "Minutes" : "Weight"}
            />
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              className="h-8 w-16 rounded border bg-transparent px-1.5 text-sm"
              aria-label={quickExercise.type === "cardio" ? "Distance" : "Reps"}
            />
            <button
              type="button"
              onClick={() => setWarmup((w) => !w)}
              className={`h-8 rounded border px-2 text-xs ${warmup ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground"}`}
            >
              W
            </button>
            <Button className="ml-auto" onClick={quickAdd}>
              + Add
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
