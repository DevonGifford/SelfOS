// PROTOTYPE — shared loading/error/empty blocks, styled to match the pattern
// already used on routes/measurements.tsx. Not "the question" this prototype
// is testing, so it's fine to share across variants.

import { Button } from "@/components/ui/button";

export function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function ErrorBlock() {
  return (
    <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">Couldn't load your exercises.</p>
      <p className="mt-1 text-muted-foreground">Something went wrong on our end — try again.</p>
      <Button size="sm" variant="outline" className="mt-3">
        Retry
      </Button>
    </div>
  );
}

export function EmptyBlock() {
  return (
    <div className="m-4 rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">No exercises yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first exercise once you start logging a session.
      </p>
    </div>
  );
}
