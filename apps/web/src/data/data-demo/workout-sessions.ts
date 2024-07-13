import type { SessionWorkoutType, SetType } from "@/data/schemas/training-shared";
import type { WorkoutSessionExercises, WorkoutSessions } from "@/data/schemas/workout-sessions";
import type { WorkoutSets } from "@/data/schemas/workout-sets";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

function dateDaysAgo(days: number): string {
  return daysAgo(days).slice(0, 10);
}

type SetSpec = {
  setType: SetType;
  weightKg?: number;
  reps?: number;
  durationSec?: number;
  distanceM?: number;
};

type ExerciseSpec = {
  exerciseId: string;
  exerciseName: string;
  sets: SetSpec[];
};

type SessionSpec = {
  id: string;
  workoutType: SessionWorkoutType;
  templateId: string | null;
  daysAgo: number;
  note?: string;
  exercises: ExerciseSpec[];
};

// A 2-day-cadence rotation (Cardio → Legs → Pull → Push, repeating) over
// the last ~16 days — two finished sessions per real Workout Type, each
// pulling its exercises from the matching "Day" Template so every
// Template exercise (Row Erg included) has real logged history, and the
// newer of each pair is a little heavier/longer than the older one so the
// progressive-overload prefill has something real to show.
const SESSION_SPECS: SessionSpec[] = [
  {
    id: "sess-cardio-1",
    workoutType: "cardio",
    templateId: "tpl-cardio-day",
    daysAgo: 2,
    note: "Easy pace, felt good",
    exercises: [
      {
        exerciseId: "ex-treadmill",
        exerciseName: "Treadmill Run",
        sets: [{ setType: "working", durationSec: 1500, distanceM: 5000 }],
      },
      {
        exerciseId: "ex-row-erg",
        exerciseName: "Row Erg",
        sets: [{ setType: "working", durationSec: 900, distanceM: 2000 }],
      },
    ],
  },
  {
    id: "sess-legs-1",
    workoutType: "legs",
    templateId: "tpl-legs-day",
    daysAgo: 4,
    exercises: [
      {
        exerciseId: "ex-squat",
        exerciseName: "Back Squat",
        sets: [
          { setType: "warmup", weightKg: 60, reps: 10 },
          { setType: "working", weightKg: 90, reps: 8 },
          { setType: "working", weightKg: 95, reps: 6 },
        ],
      },
      { exerciseId: "ex-rdl", exerciseName: "Romanian Deadlift", sets: [{ setType: "working", weightKg: 70, reps: 10 }] },
      { exerciseId: "ex-leg-press", exerciseName: "Leg Press", sets: [{ setType: "working", weightKg: 140, reps: 10 }] },
    ],
  },
  {
    id: "sess-pull-1",
    workoutType: "pull",
    templateId: "tpl-pull-day",
    daysAgo: 6,
    exercises: [
      {
        exerciseId: "ex-pullup",
        exerciseName: "Pull-up",
        sets: [
          { setType: "working", weightKg: 0, reps: 12 },
          { setType: "working", weightKg: 0, reps: 10 },
        ],
      },
      { exerciseId: "ex-row", exerciseName: "Barbell Row", sets: [{ setType: "working", weightKg: 55, reps: 10 }] },
      { exerciseId: "ex-lat-pulldown", exerciseName: "Lat Pulldown", sets: [{ setType: "working", weightKg: 50, reps: 10 }] },
    ],
  },
  {
    id: "sess-push-1",
    workoutType: "push",
    templateId: "tpl-push-day",
    daysAgo: 8,
    exercises: [
      {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        sets: [
          { setType: "warmup", weightKg: 40, reps: 15 },
          { setType: "working", weightKg: 60, reps: 11 },
          { setType: "working", weightKg: 65, reps: 11 },
          { setType: "working", weightKg: 70, reps: 6 },
          { setType: "failure", weightKg: 70, reps: 5 },
          { setType: "drop", weightKg: 45, reps: 8 },
        ],
      },
      {
        exerciseId: "ex-ohp",
        exerciseName: "Overhead Press",
        sets: [
          { setType: "working", weightKg: 45, reps: 8 },
          { setType: "working", weightKg: 45, reps: 8 },
          { setType: "working", weightKg: 45, reps: 6 },
        ],
      },
      { exerciseId: "ex-incline-db", exerciseName: "Incline Dumbbell Press", sets: [{ setType: "working", weightKg: 24, reps: 10 }] },
      { exerciseId: "ex-lateral-raise", exerciseName: "Lateral Raise", sets: [{ setType: "working", weightKg: 10, reps: 12 }] },
    ],
  },
  {
    id: "sess-cardio-2",
    workoutType: "cardio",
    templateId: "tpl-cardio-day",
    daysAgo: 10,
    exercises: [
      {
        exerciseId: "ex-treadmill",
        exerciseName: "Treadmill Run",
        sets: [{ setType: "working", durationSec: 1400, distanceM: 4500 }],
      },
      {
        exerciseId: "ex-row-erg",
        exerciseName: "Row Erg",
        sets: [{ setType: "working", durationSec: 800, distanceM: 1800 }],
      },
    ],
  },
  {
    id: "sess-legs-2",
    workoutType: "legs",
    templateId: "tpl-legs-day",
    daysAgo: 12,
    exercises: [
      {
        exerciseId: "ex-squat",
        exerciseName: "Back Squat",
        sets: [
          { setType: "warmup", weightKg: 50, reps: 10 },
          { setType: "working", weightKg: 75, reps: 8 },
        ],
      },
      { exerciseId: "ex-rdl", exerciseName: "Romanian Deadlift", sets: [{ setType: "working", weightKg: 60, reps: 10 }] },
      { exerciseId: "ex-leg-press", exerciseName: "Leg Press", sets: [{ setType: "working", weightKg: 120, reps: 10 }] },
    ],
  },
  {
    id: "sess-pull-2",
    workoutType: "pull",
    templateId: "tpl-pull-day",
    daysAgo: 14,
    exercises: [
      {
        exerciseId: "ex-pullup",
        exerciseName: "Pull-up",
        sets: [
          { setType: "working", weightKg: 0, reps: 10 },
          { setType: "working", weightKg: 0, reps: 8 },
        ],
      },
      { exerciseId: "ex-row", exerciseName: "Barbell Row", sets: [{ setType: "working", weightKg: 45, reps: 10 }] },
      { exerciseId: "ex-lat-pulldown", exerciseName: "Lat Pulldown", sets: [{ setType: "working", weightKg: 40, reps: 10 }] },
    ],
  },
  {
    id: "sess-push-2",
    workoutType: "push",
    templateId: "tpl-push-day",
    daysAgo: 16,
    exercises: [
      {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        sets: [
          { setType: "warmup", weightKg: 40, reps: 15 },
          { setType: "working", weightKg: 55, reps: 10 },
          { setType: "working", weightKg: 60, reps: 8 },
        ],
      },
      {
        exerciseId: "ex-ohp",
        exerciseName: "Overhead Press",
        sets: [
          { setType: "working", weightKg: 40, reps: 8 },
          { setType: "working", weightKg: 40, reps: 8 },
        ],
      },
      { exerciseId: "ex-incline-db", exerciseName: "Incline Dumbbell Press", sets: [{ setType: "working", weightKg: 20, reps: 10 }] },
      { exerciseId: "ex-lateral-raise", exerciseName: "Lateral Raise", sets: [{ setType: "working", weightKg: 8, reps: 12 }] },
    ],
  },
];

function buildFixtures(specs: SessionSpec[]) {
  const sessions: WorkoutSessions = [];
  const sessionExercises: WorkoutSessionExercises = [];
  const sets: WorkoutSets = [];

  for (const spec of specs) {
    sessions.push({
      id: spec.id,
      workoutType: spec.workoutType,
      templateId: spec.templateId,
      note: spec.note ?? null,
      date: dateDaysAgo(spec.daysAgo),
      finishedAt: daysAgo(spec.daysAgo),
      createdAt: daysAgo(spec.daysAgo),
    });

    spec.exercises.forEach((exercise, exerciseIndex) => {
      const sessionExerciseId = `se-${spec.id}-${exercise.exerciseId}`;
      sessionExercises.push({
        id: sessionExerciseId,
        sessionId: spec.id,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        note: null,
        position: exerciseIndex,
      });

      exercise.sets.forEach((set, setIndex) => {
        sets.push({
          id: `set-${spec.id}-${exercise.exerciseId}-${setIndex}`,
          sessionExerciseId,
          setType: set.setType,
          confirmed: true,
          note: null,
          weightKg: set.weightKg ?? null,
          reps: set.reps ?? null,
          durationSec: set.durationSec ?? null,
          distanceM: set.distanceM ?? null,
          createdAt: daysAgo(spec.daysAgo),
        });
      });
    });
  }

  return { sessions, sessionExercises, sets };
}

const fixtures = buildFixtures(SESSION_SPECS);

export const demoWorkoutSessions: WorkoutSessions = fixtures.sessions;
export const demoWorkoutSessionExercises: WorkoutSessionExercises = fixtures.sessionExercises;

// Re-exported from data-demo/workout-sets.ts too, since sessions/sets are
// built together from one spec (a session's sets can't be authored
// without knowing the sessionExerciseId this builder assigns) but every
// other domain's convention is one file per resource.
export const demoWorkoutSets: WorkoutSets = fixtures.sets;
