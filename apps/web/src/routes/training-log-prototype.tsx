// PROTOTYPE ROUTE — throwaway, answers ticket 02 on
// .scratch/training-feature/map.md ("what should the Training logging flow
// look and behave like"). Single design now (the hybrid decided on, then
// deepened against Strong app reference screenshots) — no more variant
// switcher, since the "which layout" question is resolved. ?scenario=
// normal|loading|error|empty still previews the three load states on the
// start screen. Not linked from nav; not for production. Remove this route
// (and this file, and features/training-prototype/) once the direction is
// folded into the real build — see the prototype skill's "capture and clean
// up" step.

import { useSearchParams } from "react-router";

import type { Scenario } from "@/features/training-prototype/fixtures";
import { TrainingLoggingScreen } from "@/features/training-prototype/training-logging-screen";

export function TrainingLogPrototypePage() {
  const [params] = useSearchParams();
  const scenario = (params.get("scenario") as Scenario | null) ?? "normal";

  return <TrainingLoggingScreen scenario={scenario} />;
}
