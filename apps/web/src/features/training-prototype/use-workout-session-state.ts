// PROTOTYPE — shared session state machine. Answers tickets 02 and 04 on
// .scratch/training-feature/map.md. Templates are now real, mutable state
// (archive/restore/default/create/update) rather than a static catalog,
// since ticket 04 is specifically about that lifecycle.

import { useState } from "react";

import type {
  Exercise,
  LoggedSet,
  SessionType,
  SetType,
  Template,
  WorkoutType,
} from "@/features/training-prototype/fixtures";
import { EXERCISES, INITIAL_TEMPLATES, LAST_SESSION_SETS } from "@/features/training-prototype/fixtures";

export type SessionStep = "start" | "logging" | "finished";
export type ActionResult = { ok: true } | { ok: false; reason: string };

let nextId = 1000;

export function useWorkoutSessionState() {
  const [step, setStep] = useState<SessionStep>("start");
  const [workoutType, setWorkoutType] = useState<SessionType | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState("");
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [exerciseNameOverrides, setExerciseNameOverrides] = useState<Record<string, string>>({});
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);

  // Real, mutable template state — ticket 04 is specifically about this
  // lifecycle (archive/restore/default), unlike ticket 02's static catalog.
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);

  const allExercises = [...EXERCISES, ...customExercises];

  function findExercise(exerciseId: string) {
    return allExercises.find((e) => e.id === exerciseId);
  }

  function templatesFor(type: WorkoutType) {
    return templates.filter((t) => t.workoutType === type);
  }

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

  function startFromTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setWorkoutType(tpl.workoutType);
    setTemplateId(tpl.id);
    setExerciseIds(tpl.exerciseIds);
    seedPendingSets(tpl.exerciseIds);
    setStartedAt(new Date());
    setStep("logging");
  }

  // Both "Start empty {Type} workout" (from the picker, a real Workout
  // Type) and the full-width Freestyle button (SessionType's 5th value)
  // land here — the only difference is which SessionType is passed in.
  function startEmpty(type: SessionType) {
    setWorkoutType(type);
    setTemplateId(null);
    setExerciseIds([]);
    setSets([]);
    setStartedAt(new Date());
    setStep("logging");
  }

  function addExercise(exerciseId: string) {
    setExerciseIds((ids) => (ids.includes(exerciseId) ? ids : [...ids, exerciseId]));
  }

  function moveExercise(exerciseId: string, direction: -1 | 1) {
    setExerciseIds((ids) => {
      const index = ids.indexOf(exerciseId);
      const swapWith = index + direction;
      if (index === -1 || swapWith < 0 || swapWith >= ids.length) return ids;
      const next = [...ids];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  function createExercise(name: string): Exercise {
    const exercise: Exercise = {
      id: `custom-${nextId++}`,
      name,
      type: "strength",
      workoutType: workoutType && workoutType !== "freestyle" ? workoutType : "push",
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

  function cancelSession() {
    reset();
  }

  function adjustTimes(newStartedAt: Date, newFinishedAt: Date | null) {
    setStartedAt(newStartedAt);
    setFinishedAt(newFinishedAt);
  }

  function reset() {
    setStep("start");
    setWorkoutType(null);
    setTemplateId(null);
    setSessionNote("");
    setExerciseIds([]);
    setExerciseNotes({});
    setExerciseNameOverrides({});
    setCustomExercises([]);
    setSets([]);
    setStartedAt(null);
    setFinishedAt(null);
  }

  // ---- Template lifecycle (ticket 04) ----

  function templateNameConflict(type: WorkoutType, name: string, excludeId?: string) {
    const normalized = name.trim().toLowerCase();
    return templates.some((t) => t.workoutType === type && t.id !== excludeId && t.name.trim().toLowerCase() === normalized);
  }

  // A session's own exercise list/order is the source of truth for what a
  // Template becomes — the prototype's simplified fixtures don't model a
  // template's own per-set suggested values separately from
  // LAST_SESSION_SETS, so "the template" here is really just its exercise
  // list. The real build follows workout_template_sets, not this shortcut.
  function saveSessionAsNewTemplate(type: WorkoutType, name: string): ActionResult {
    if (!name.trim()) return { ok: false, reason: "Name is required." };
    if (templateNameConflict(type, name)) {
      return { ok: false, reason: `A template named "${name.trim()}" already exists for ${type}.` };
    }
    const template: Template = {
      id: `tpl-${nextId++}`,
      name: name.trim(),
      workoutType: type,
      exerciseIds,
      isDefault: false,
      archived: false,
    };
    setTemplates((list) => [...list, template]);
    return { ok: true };
  }

  function updateSourceTemplate(): ActionResult {
    if (!templateId) return { ok: false, reason: "This session didn't start from a template." };
    setTemplates((list) => list.map((t) => (t.id === templateId ? { ...t, exerciseIds } : t)));
    return { ok: true };
  }

  function archiveTemplate(id: string): ActionResult {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return { ok: false, reason: "Template not found." };
    if (tpl.isDefault) {
      return { ok: false, reason: "Pick a new default for this Workout Type before archiving it." };
    }
    setTemplates((list) => list.map((t) => (t.id === id ? { ...t, archived: true } : t)));
    return { ok: true };
  }

  function restoreTemplate(id: string) {
    setTemplates((list) => list.map((t) => (t.id === id ? { ...t, archived: false } : t)));
  }

  function setDefaultTemplate(id: string) {
    setTemplates((list) => {
      const target = list.find((t) => t.id === id);
      if (!target) return list;
      return list.map((t) => (t.workoutType === target.workoutType ? { ...t, isDefault: t.id === id } : t));
    });
  }

  return {
    step,
    workoutType,
    templateId,
    sessionNote,
    exerciseIds,
    exerciseNotes,
    exerciseNameOverrides,
    allExercises,
    sets,
    startedAt,
    finishedAt,
    templates,
    templatesFor,
    setSessionNote,
    startFromTemplate,
    startEmpty,
    addExercise,
    moveExercise,
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
    reset,
    templateNameConflict,
    saveSessionAsNewTemplate,
    updateSourceTemplate,
    archiveTemplate,
    restoreTemplate,
    setDefaultTemplate,
  };
}

export type WorkoutSessionState = ReturnType<typeof useWorkoutSessionState>;
