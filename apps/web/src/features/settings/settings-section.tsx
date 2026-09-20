import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Settings can afford clearer, larger section headers than Home's dense
// StatusSection — this is a page for deliberately editing forms, not
// scanning at a glance. Collapsed by default (see settings.tsx): a clean
// list of section headers on first load, nothing pre-expanded.
export function SettingsSection({ title, badge, defaultOpen = false, children }: SettingsSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t py-4">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide">{title}</span>
          {badge}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="pt-4">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

// Re-exported so settings.tsx doesn't need a second import line for a
// className it only uses once — kept here since it's this component's own
// visual vocabulary (the muted small-pill convention already established
// by components/ui/demo-data-badge.tsx).
export function SettingsSectionBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
