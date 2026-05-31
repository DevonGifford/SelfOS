import { useEffect, useState } from "react";

const LINES = [
  "[BOOT] Initializing SELF/OS.......... ✅",
  "[API]  Connecting to Go API.......... ✅",
  "[AUTH] Validating credentials........ ✅",
  "[AUTH] Signing session............... ✅",
  "[DB]   Connecting to Neon/Postres.... ✅",
  "[DATA] Loading personal state........ ✅",
  "[OK]   Access granted",
];

// Pause after each non-final line finishes typing, before the next line
// starts. Longer on steps that'd plausibly take longer for real (API, DB).
const LINE_PAUSES = [60, 140, 90, 60, 180, 100];

// Progress checkpoint reached when each non-final line finishes typing.
// Capped below 95 so the bar can never hit 100 before the terminal is done —
// the terminal is the source of truth for completion, not an independent timer.
const LINE_PROGRESS = [12, 28, 42, 58, 75, 90];

function getCharDelay(char: string) {
  if (char === ".") return 12 + Math.random() * 6;
  if (char === "✅") return 20 + Math.random() * 10;
  if (char === " ") return 3;
  return 4 + Math.random() * 4;
}

export function useBootSequence(onDone: () => void) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (lineIndex >= LINES.length) return;

    const line = LINES[lineIndex];
    const isFinalLine = lineIndex === LINES.length - 1;

    if (charIndex < line.length) {
      const timer = setTimeout(() => setCharIndex((c) => c + 1), getCharDelay(line[charIndex]));
      return () => clearTimeout(timer);
    }

    if (isFinalLine) {
      // Final line has fully typed — only now is the bar allowed to complete.
      const timer = setTimeout(() => setProgress(100), 150);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setProgress(LINE_PROGRESS[lineIndex] ?? 90);
      setLineIndex((l) => l + 1);
      setCharIndex(0);
    }, LINE_PAUSES[lineIndex] ?? 100);
    return () => clearTimeout(timer);
  }, [lineIndex, charIndex]);

  // onDone is coordinated off the same `progress` state the bar renders from,
  // not a second independent timer — it only fires once progress hits 100.
  useEffect(() => {
    if (progress !== 100) return;
    const timer = setTimeout(onDone, 300);
    return () => clearTimeout(timer);
  }, [progress, onDone]);

  const completed = LINES.slice(0, lineIndex);
  const displayedLines =
    lineIndex >= LINES.length ? completed : [...completed, LINES[lineIndex].slice(0, charIndex)];

  return { displayedLines, progress };
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-3/4 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-foreground transition-[width] duration-200 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function TerminalOutput({ lines }: { lines: string[] }) {
  return (
    <div className="font-mono text-xs whitespace-pre text-muted-foreground">
      {lines.map((line, i) => (
        <p key={i}>
          {line}
          {i === lines.length - 1 && <span className="animate-pulse">_</span>}
        </p>
      ))}
    </div>
  );
}
