// PROTOTYPE ROUTE — throwaway, answers ticket 02 on
// .scratch/training-feature/map.md ("what should the Training logging flow
// look and behave like"). Three structurally different variants, switchable
// via ?variant=A|B|C, plus ?scenario=normal|loading|error|empty to preview
// the three load states on the start screen. Not linked from nav; not for
// production. Remove this route (and this file, and
// features/training-prototype/) once a direction is picked — see the
// prototype skill's "capture and clean up" step.

import { useSearchParams } from "react-router";

import type { Scenario } from "@/features/training-prototype/fixtures";
import { PrototypeSwitcher } from "@/features/training-prototype/prototype-switcher";
import { VariantA } from "@/features/training-prototype/variant-a-accordion";
import { VariantB } from "@/features/training-prototype/variant-b-focus";
import { VariantC } from "@/features/training-prototype/variant-c-feed";

export function TrainingLogPrototypePage() {
  const [params] = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const scenario = (params.get("scenario") as Scenario | null) ?? "normal";

  return (
    <>
      {variant === "A" && <VariantA scenario={scenario} />}
      {variant === "B" && <VariantB scenario={scenario} />}
      {variant === "C" && <VariantC scenario={scenario} />}
      <PrototypeSwitcher />
    </>
  );
}
