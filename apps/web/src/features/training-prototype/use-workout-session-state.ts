// PROTOTYPE — shared session state machine so all three UI variants behave
// identically underneath (the question is layout/interaction, not logic).
// Answers ticket 02 on .scratch/training-feature/map.md.

import { useState } from "react";

import type { Category, LoggedSet } from "@/features/training-prototype/fixtures";
import { EXERCISES, LAST_SESSION_SETS, TEMPLATES } from "@/features/training-prototype/fixtures";

export type SessionStep = "start" | "logging" | "finished";

let nextId = 1000;

export function useWorkoutSessionState() {
  const [step, setStep] = useState<SessionStep>("start");
  const [category, setCategory] = useState<Category | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState("");
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);

  function startFromTemplate(tplId: string) {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setCategory(tpl.category);
    setTemplateId(tpl.id);
    setExerciseIds(tpl.exerciseIds);
    setStep("logging");
  }

  function startFreestyle(cat: Category) {
    setCategory(cat);
    setTemplateId(null);
    setExerciseIds([]);
    setStep("logging");
  }

  function addExercise(exerciseId: string) {
    setExerciseIds((ids) => (ids.includes(exerciseId) ? ids : [...ids, exerciseId]));
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
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    const last = suggestedFor(exerciseId);

    const set: LoggedSet = {
      id: `s${nextId++}`,
      exerciseId,
      isWarmup: false,
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

  function removeSet(setId: string) {
    setSets((s) => s.filter((set) => set.id !== setId));
  }

  function finish() {
    setStep("finished");
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
    setSets([]);
    setSavedAsTemplate(false);
  }

  return {
    step,
    category,
    templateId,
    sessionNote,
    exerciseIds,
    sets,
    savedAsTemplate,
    setSessionNote,
    startFromTemplate,
    startFreestyle,
    addExercise,
    addSet,
    updateSet,
    removeSet,
    lastSetFor,
    suggestedFor,
    finish,
    saveAsTemplate,
    reset,
  };
}

export type WorkoutSessionState = ReturnType<typeof useWorkoutSessionState>;
