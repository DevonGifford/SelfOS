import type { PropsWithChildren, ReactNode } from "react";

type SectionStatProps = PropsWithChildren<{
  label: string;
  value?: ReactNode;
}>;

export function SectionStat({ label, value, children }: SectionStatProps) {
  return (
    <section className="border-t py-4">
      <p className="font-mono text-xs uppercase text-muted-foreground">
        {label}
      </p>

      {value !== undefined ? (
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      ) : (
        <div className="mt-2">{children}</div>
      )}
    </section>
  );
}
