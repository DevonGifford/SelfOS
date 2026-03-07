import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type StatusSectionProps = {
  title?: ReactNode;
  /** Optional muted, smaller second line under `title` — e.g. Training's
   * "Cardio · 2 days ago" under the static "Last workout" heading, so the
   * heading itself stays the same static label/style as every other
   * StatusSection instead of being replaced by derived content. */
  subtitle?: ReactNode;
  bordered?: boolean;
  className?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Home's compact counterpart to SettingsSection — same Collapsible
// primitive, much lighter presentation: the small mono-uppercase heading
// Training/Habits Graph already used, a small chevron, defaulting open
// (this pass is about structure, not hiding what Home shows today).
// `title` is optional — Nutrition has none ("the progress bars are already
// self-explanatory"), so the trigger collapses to a lone corner chevron
// rather than a full header row.
export function StatusSection({
  title,
  subtitle,
  bordered = true,
  className,
  defaultOpen = true,
  children,
}: StatusSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn(bordered && "border-t pt-4", className)}>
      {title ? (
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left">
          <div>
            <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>
      ) : (
        <div className="flex h-3 items-center justify-end">
          <CollapsibleTrigger
            aria-label="Toggle section"
            className="group text-muted-foreground/40 hover:text-muted-foreground"
          >
            <ChevronDown className="size-3 transition-transform group-data-[panel-open]:rotate-180" />
          </CollapsibleTrigger>
        </div>
      )}
      <CollapsiblePanel>
        <div className={title ? "mt-4" : "mt-1"}>{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
