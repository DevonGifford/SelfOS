// PROTOTYPE — floating variant/scenario switcher. Dev-only, not shipped.
// Answers ticket 02 on .scratch/training-feature/map.md.

import { useEffect } from "react";
import { useSearchParams } from "react-router";

import type { Scenario } from "@/features/training-prototype/fixtures";

export const VARIANTS = [
  { key: "A", name: "Accordion" },
  { key: "B", name: "Single-Set Focus" },
  { key: "C", name: "Quick-Add Feed" },
] as const;

const SCENARIOS: Scenario[] = ["normal", "loading", "error", "empty"];

export function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const scenario = (params.get("scenario") as Scenario | null) ?? "normal";
  const index = VARIANTS.findIndex((v) => v.key === variant);

  function go(delta: number) {
    const nextIndex = (index + delta + VARIANTS.length) % VARIANTS.length;
    setParams((p) => {
      p.set("variant", VARIANTS[nextIndex].key);
      return p;
    });
  }

  function setScenario(next: Scenario) {
    setParams((p) => {
      p.set("scenario", next);
      return p;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/90 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => go(-1)}
          className="px-1 font-mono text-yellow-400 hover:text-yellow-200"
          aria-label="Previous variant"
        >
          ←
        </button>

        <span className="font-mono font-semibold text-yellow-300">
          {variant} · {VARIANTS[index]?.name}
        </span>

        <button
          type="button"
          onClick={() => go(1)}
          className="px-1 font-mono text-yellow-400 hover:text-yellow-200"
          aria-label="Next variant"
        >
          →
        </button>

        <span className="mx-1 h-3 w-px bg-white/20" />

        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as Scenario)}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-white"
        >
          {SCENARIOS.map((s) => (
            <option key={s} value={s} className="text-black">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
