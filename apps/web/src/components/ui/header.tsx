import type { ReactNode } from "react";

import { ProgressRing } from "@/components/ui/progress-ring";

type HeaderMetric = {
  label: ReactNode;
  value: ReactNode;
  /** 0..1 */
  progress: number;
  href?: string;
  linkClassName?: string;
};

type HeaderProps = {
  eyebrow?: ReactNode;
  badge?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  primary?: HeaderMetric;
  secondary?: HeaderMetric;
  /** Optional line below the title row — a tip/warning message, page actions, whatever the caller wants there. Unstyled: bring your own wrapper. */
  note?: ReactNode;
};

export function Header({ eyebrow, badge, title, subtitle, note, primary, secondary }: HeaderProps) {
  return (
    <header>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 mt-2">
              {eyebrow || badge ? (
                <div className="flex items-center gap-2">
                  {eyebrow ? (
                    <p className="font-mono text-xs italic uppercase tracking-widest text-muted-foreground">
                      {eyebrow}
                    </p>
                  ) : null}

                  {badge}
                </div>
              ) : null}

              <h1 className="min-w-0 text-xl font-heading uppercase">{title}</h1>

              {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>

            {secondary ? (
              <ProgressRing
                progress={secondary.progress}
                value={secondary.value}
                label={secondary.label}
                size={70}
                strokeWidth={4}
                valueClassName="text-xs translate-y-1"
                href={secondary.href}
                linkClassName={secondary.linkClassName}
                className="translate-x-2.5"
              />
            ) : null}
          </div>

          {note ? <div className="mt-3">{note}</div> : null}
        </div>

        {primary ? (
          <ProgressRing
            progress={primary.progress}
            value={primary.value}
            label={primary.label}
            size={116}
            valueClassName="text-xl font-semibold"
            href={primary.href}
            linkClassName={primary.linkClassName}
            className="translate-x-2.5"
          />
        ) : null}
      </div>
    </header>
  );
}
