// PROTOTYPE — a first-pass rest timer. Deliberately simple: a Popover (not
// a full-screen takeover) so starting a rest timer doesn't disrupt the
// active workout underneath. Preset durations plus a custom one. Answers
// the "Rest timer" section of ticket 02's shadcn refinement pass.

import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRESETS_SEC = [30, 60, 90, 120, 180];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const timeout = setTimeout(() => setRemaining((r) => (r !== null && r > 1 ? r - 1 : null)), 1000);
    return () => clearTimeout(timeout);
  }, [remaining]);

  function start(seconds: number) {
    setRemaining(seconds);
    setOpen(false);
  }

  if (remaining !== null) {
    return (
      <button
        type="button"
        onClick={() => setRemaining(null)}
        className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary"
      >
        <TimerIcon className="size-3.5" />
        {formatDuration(remaining)}
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          />
        }
      >
        <TimerIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Rest Timer</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS_SEC.map((seconds) => (
            <Button key={seconds} size="sm" variant="outline" onClick={() => start(seconds)}>
              {formatDuration(seconds)}
            </Button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            type="number"
            placeholder="Seconds"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="h-8"
          />
          <Button
            size="sm"
            disabled={!customValue}
            onClick={() => {
              const seconds = Number(customValue);
              if (seconds > 0) start(seconds);
              setCustomValue("");
            }}
          >
            Start
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
