import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The exercise-level "..." menu — a real shadcn DropdownMenu with a
// small, deliberately-short action list.
export function ExerciseMenu({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onAddNote,
  onAddWarmupSet,
  onReplace,
  onRemove,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddNote: () => void;
  onAddWarmupSet: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="whitespace-nowrap" disabled={!canMoveUp} onClick={onMoveUp}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem className="whitespace-nowrap" disabled={!canMoveDown} onClick={onMoveDown}>
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="whitespace-nowrap" onClick={onAddNote}>
          Add note
        </DropdownMenuItem>
        <DropdownMenuItem className="whitespace-nowrap" onClick={onAddWarmupSet}>
          Add warm-up set
        </DropdownMenuItem>
        <DropdownMenuItem className="whitespace-nowrap" onClick={onReplace}>
          Replace exercise
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="whitespace-nowrap" variant="destructive" onClick={onRemove}>
          Remove exercise
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
