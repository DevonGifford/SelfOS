import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SET_TYPE_BADGE, SET_TYPE_COLOR, SET_TYPE_LABEL, formatSetBase } from "@/features/training/set-format";
import type { ExerciseType, SetType } from "@/data/schemas/training-shared";
import type { WorkoutSet } from "@/data/schemas/workout-sets";

type SetPatch = {
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
};

// A single logged-set row. Numeric fields are local state, committed
// onBlur — the underlying mutation is optimistic, but firing it on every
// keystroke would be excessive network chatter for the app's
// highest-frequency write.
export function SetRow({
  exerciseType,
  set,
  rowLabel,
  priorSet,
  onUpdate,
  onSetType,
  onToggleConfirmed,
  onRemove,
}: {
  exerciseType: ExerciseType;
  set: WorkoutSet;
  rowLabel: string;
  priorSet: WorkoutSet | undefined;
  onUpdate: (patch: SetPatch) => void;
  onSetType: (t: SetType) => void;
  onToggleConfirmed: () => void;
  onRemove: () => void;
}) {
  const [weight, setWeight] = useState(String(set.weightKg ?? ""));
  const [reps, setReps] = useState(String(set.reps ?? ""));
  const [minutes, setMinutes] = useState(set.durationSec ? String(Math.round(set.durationSec / 60)) : "");
  const [km, setKm] = useState(set.distanceM ? String(set.distanceM / 1000) : "");

  const priorBadge = priorSet ? SET_TYPE_BADGE[priorSet.setType] : "";

  return (
    <>
      {/* Lightweight, not a full editor: tapping the set indicator itself
          opens a small menu to reclassify it. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<button type="button" className="-ml-0.5 flex h-7 w-5 items-center justify-center" />}
        >
          <span className={`text-xs font-semibold ${SET_TYPE_COLOR[set.setType]}`}>{rowLabel}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(["working", "warmup", "drop", "failure"] as SetType[]).map((t) => (
            <DropdownMenuItem key={t} className="whitespace-nowrap" onClick={() => onSetType(t)}>
              <span className={`w-4 font-semibold ${SET_TYPE_COLOR[t]}`}>{SET_TYPE_BADGE[t] || "•"}</span>
              {SET_TYPE_LABEL[t]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="truncate text-muted-foreground normal-case">
        {priorSet ? (
          <>
            {formatSetBase(exerciseType, priorSet)}
            {priorBadge ? <span className={`ml-1 ${SET_TYPE_COLOR[priorSet.setType]}`}>[{priorBadge}]</span> : null}
          </>
        ) : (
          "—"
        )}
      </span>

      {exerciseType === "cardio" ? (
        <>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onBlur={() => onUpdate({ durationSec: minutes ? Number(minutes) * 60 : null })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
          <input
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            onBlur={() => onUpdate({ distanceM: km ? Number(km) * 1000 : null })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => onUpdate({ weightKg: weight ? Number(weight) : null })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={() => onUpdate({ reps: reps ? Number(reps) : null })}
            className="h-8 w-full min-w-0 rounded-lg border bg-transparent px-1 text-center text-sm text-foreground"
          />
        </>
      )}

      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleConfirmed}
          aria-pressed={set.confirmed}
          className={
            set.confirmed
              ? "flex size-7 items-center justify-center rounded-md bg-emerald-500 text-white"
              : "flex size-7 items-center justify-center rounded-md border text-muted-foreground"
          }
        >
          ✓
        </button>
        <AlertDialog>
          <AlertDialogTrigger render={<button type="button" className="text-muted-foreground hover:text-destructive" />}>
            <Trash2 className="size-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete set?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onRemove}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
    </>
  );
}
