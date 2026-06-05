// Marks a page or section as still backed by demo-client.ts fabricated
// data (CONTEXT.md's Demo Mode) rather than a real domain — so a real
// number is never mistaken for a fake one, or vice versa, once this is
// deployed somewhere other than localhost (ticket 13).
export function DemoDataBadge() {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      Demo data
    </span>
  );
}
