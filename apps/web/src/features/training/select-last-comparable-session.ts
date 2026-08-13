import type { TrainingDay } from "@/data/schemas/training";
import type { TrainingHistory, TrainingSession } from "@/data/schemas/training-history";

function latest(sessions: TrainingHistory) {
  return sessions.reduce<TrainingSession | undefined>((latestSoFar, session) => {
    if (!latestSoFar || session.date > latestSoFar.date) return session;
    return latestSoFar;
  }, undefined);
}

export function selectLastComparableSession(
  history: TrainingHistory,
  today: TrainingDay,
): TrainingSession | undefined {
  if (today === "rest") return latest(history);

  if (today === "cardio") {
    return latest(history.filter((session) => session.type === "cardio"));
  }

  return latest(
    history.filter((session) => session.type === "strength" && session.routine === today),
  );
}
