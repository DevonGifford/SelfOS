import type { DemoDomain } from "@/data/client";

// Marks a page or section as still backed by demo-client.ts fabricated
// data (CONTEXT.md's Demo Mode) rather than a real domain — so a real
// number is never mistaken for a fake one, or vice versa, once this is
// deployed somewhere other than localhost (ticket 13).
//
// `domain` isn't rendered — its only job is to require a `DemoDomain`
// member. When a domain moves into client.ts's real-backend re-exports and
// drops out of DEMO_DOMAINS, every call site still passing it here stops
// compiling instead of silently shipping a stale badge.
type DemoDataBadgeProps = {
  domain: DemoDomain;
};

export function DemoDataBadge({ domain: _domain }: DemoDataBadgeProps) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      Demo data
    </span>
  );
}
