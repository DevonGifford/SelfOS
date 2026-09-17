// PROTOTYPE — shared session state machine for the (single, now-decided)
// logging UI. Answers ticket 02 on .scratch/training-feature/map.md, revised
// after the Strong reference screenshots round and the shadcn refinement pass.

import { useState } from "react";

import type { Category, Exercise, LoggedSet, SetType } from "@/features/training-prototype/fixtures";
import { EXERCISES, LAST_SESSION_SETS, TEMPLATES } from "@/features/training-prototype/fixtures";

export type SessionStep = "start" | "logging" | "finished";

let nextId = 1000;

export function useWorkoutSessionState() {
  const [step, setStep] = useState<SessionStep>("start");
  const [category, setCategory] = useState<Category | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState("");
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [exerciseNameOverrides, setExerciseNameOverrides] = useState<Record<string, string>>({});
  // "New Exercise" from the Add Exercise flow — ad-hoc, session-scoped.
  // A real build would create a genuine Exercise Definition via the API;
  // here it's just enough to demonstrate the flow isn't a dead end.
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  // Mock wall-clock times, editable via "Adjust start/end time" — ticket 03.
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);

  const allExercises = [...EXERCISES, ...customExercises];

  function findExercise(exerciseId: string) {
    return allExercises.find((e) => e.id === exerciseId);
  }

  // A Template's suggested sets double, in this prototype, for the same
  // snapshot data LAST_SESSION_SETS already holds — seeded as *unconfirmed*
  // pending rows, matching Strong: starting from a template shows its sets
  // immediately, waiting for you to confirm (or adjust first).
  function seedPendingSets(ids: string[]) {
    const seeded: LoggedSet[] = [];
    for (const exerciseId of ids) {
      const prior = LAST_SESSION_SETS[exerciseId] ?? [];
      for (const set of prior) {
        seeded.push({ ...set, id: `s${nextId++}`, confirmed: false });
      }
    }
    setSets(seeded);
  }

  function startFromTemplate(tplId: string) {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setCategory(tpl.category);
    setTemplateId(tpl.id);
    setExerciseIds(tpl.exerciseIds);
    seedPendingSets(tpl.exerciseIds);
    setStartedAt(new Date());
    setStep("logging");
  }

  function startFreestyle(cat: Category) {
    setCategory(cat);
    setTemplateId(null);
    setExerciseIds([]);
    setSets([]);
    setStartedAt(new Date());
    setStep("logging");
  }

  // Always appends — exerciseIds is insertion-order, and every render walks
  // it in that order, so "new exercises go to the bottom" falls out for
  // free rather than needing separate position bookkeeping.
  function addExercise(exerciseId: string) {
    setExerciseIds((ids) => (ids.includes(exerciseId) ? ids : [...ids, exerciseId]));
  }

  function createExercise(name: string): Exercise {
    const exercise: Exercise = {
      id: `custom-${nextId++}`,
      name,
      type: "strength",
      category: category ?? "freestyle",
    };
    setCustomExercises((list) => [...list, exercise]);
    return exercise;
  }

  function removeExercise(exerciseId: string) {
    setExerciseIds((ids) => ids.filter((id) => id !== exerciseId));
    setSets((s) => s.filter((set) => set.exerciseId !== exerciseId));
    setExerciseNotes(({ [exerciseId]: _removed, ...rest }) => rest);
    setExerciseNameOverrides(({ [exerciseId]: _removed, ...rest }) => rest);
  }

  // Swaps the exercise at this slot for a different one, in place — matches
  // Strong's "Replace exercise." Already-logged sets for the old exercise
  // don't carry over (they were logged against a different exercise).
  function replaceExercise(oldExerciseId: string, newExerciseId: string) {
    setExerciseIds((ids) => ids.map((id) => (id === oldExerciseId ? newExerciseId : id)));
    setSets((s) => s.filter((set) => set.exerciseId !== oldExerciseId));
    setExerciseNotes(({ [oldExerciseId]: _removed, ...rest }) => rest);
    setExerciseNameOverrides(({ [oldExerciseId]: _removed, ...rest }) => rest);
  }

  function renameExercise(exerciseId: string, name: string) {
    setExerciseNameOverrides((overrides) => ({ ...overrides, [exerciseId]: name }));
  }

  function lastSetFor(exerciseId: string): LoggedSet | undefined {
    const prior = LAST_SESSION_SETS[exerciseId];
    if (!prior) return undefined;
    return prior[prior.length - 1];
  }

  function suggestedFor(exerciseId: string): LoggedSet | undefined {
    const previousInThisSession = [...sets].reverse().find((set) => set.exerciseId === exerciseId);
    return previousInThisSession ?? lastSetFor(exerciseId);
  }

  function addSet(exerciseId: string, overrides?: Partial<LoggedSet>) {
    const exercise = findExercise(exerciseId);
    const last = suggestedFor(exerciseId);

    const set: LoggedSet = {
      id: `s${nextId++}`,
      exerciseId,
      setType: "working",
      confirmed: false,
      weightKg: exercise?.type === "strength" ? last?.weightKg : undefined,
      reps: exercise?.type === "strength" ? last?.reps : undefined,
      durationSec: exercise?.type === "cardio" ? last?.durationSec : undefined,
      distanceM: exercise?.type === "cardio" ? last?.distanceM : undefined,
      ...overrides,
    };
    setSets((s) => [...s, set]);
    addExercise(exerciseId);
  }

  function updateSet(setId: string, patch: Partial<LoggedSet>) {
    setSets((s) => s.map((set) => (set.id === setId ? { ...set, ...patch } : set)));
  }

  function toggleConfirmed(setId: string) {
    setSets((s) => s.map((set) => (set.id === setId ? { ...set, confirmed: !set.confirmed } : set)));
  }

  function setSetType(setId: string, setType: SetType) {
    updateSet(setId, { setType });
  }

  function removeSet(setId: string) {
    setSets((s) => s.filter((set) => set.id !== setId));
  }

  function setExerciseNote(exerciseId: string, note: string) {
    setExerciseNotes((notes) => ({ ...notes, [exerciseId]: note }));
  }

  function finish() {
    setFinishedAt(new Date());
    setStep("finished");
  }

  // "Cancel Workout" — a hard delete of the whole in-progress session and
  // its sets, matching ticket 03's amendment. No confirmation dialog in the
  // prototype; the real build should ask before discarding logged sets.
  function cancelSession() {
    reset();
  }

  function adjustTimes(newStartedAt: Date, newFinishedAt: Date | null) {
    setStartedAt(newStartedAt);
    setFinishedAt(newFinishedAt);
  }

  function saveAsTemplate() {
    setSavedAsTemplate(true);
  }

  function reset() {
    setStep("start");
    setCategory(null);
    setTemplateId(null);
    setSessionNote("");
    setExerciseIds([]);
    setExerciseNotes({});
    setExerciseNameOverrides({});
    setCustomExercises([]);
    setSets([]);
    setSavedAsTemplate(false);
    setStartedAt(null);
    setFinishedAt(null);
  }

  return {
    step,
    category,
    templateId,
    sessionNote,
    exerciseIds,
    exerciseNotes,
    exerciseNameOverrides,
    allExercises,
    sets,
    savedAsTemplate,
    startedAt,
    finishedAt,
    setSessionNote,
    startFromTemplate,
    startFreestyle,
    addExercise,
    createExercise,
    removeExercise,
    replaceExercise,
    renameExercise,
    addSet,
    updateSet,
    toggleConfirmed,
    setSetType,
    removeSet,
    setExerciseNote,
    lastSetFor,
    suggestedFor,
    finish,
    cancelSession,
    adjustTimes,
    saveAsTemplate,
    reset,
  };
}

export type WorkoutSessionState = ReturnType<typeof useWorkoutSessionState>;
