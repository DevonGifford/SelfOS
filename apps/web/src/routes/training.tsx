import { useState } from "react";

import { FinishedScreen } from "@/features/training/finished-screen";
import { ErrorBlock, LoadingSkeleton } from "@/features/training/load-states";
import { LoggingScreen } from "@/features/training/logging-screen";
import { StartScreen } from "@/features/training/start-screen";
import { useUnfinishedWorkoutSession, useWorkoutSession } from "@/features/training/use-workout-sessions";

// Step is derived, not stored: an unfinished Session means "logging",
// none means "start." "Finished" is the one genuinely local piece — once
// finishWorkoutSession succeeds the Session drops out of "unfinished," so
// this holds which Session to show the recap for until the user taps Done.
export function TrainingPage() {
  const unfinishedQuery = useUnfinishedWorkoutSession();
  const [finishedSessionId, setFinishedSessionId] = useState<string | null>(null);
  const finishedSessionQuery = useWorkoutSession(finishedSessionId);

  if (unfinishedQuery.isPending) return <LoadingSkeleton />;
  if (unfinishedQuery.isError) return <ErrorBlock />;

  if (finishedSessionId) {
    if (!finishedSessionQuery.data) return <LoadingSkeleton />;
    return <FinishedScreen session={finishedSessionQuery.data} onDone={() => setFinishedSessionId(null)} />;
  }

  if (unfinishedQuery.data) {
    return <LoggingScreen session={unfinishedQuery.data} onFinished={setFinishedSessionId} />;
  }

  return <StartScreen />;
}
