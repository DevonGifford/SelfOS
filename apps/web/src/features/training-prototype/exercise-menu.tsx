// PROTOTYPE — the exercise-level "..." menu. Was a direct note-toggle
// button; now a real shadcn DropdownMenu with a small, deliberately-short
// action list. Answers ticket 02's shadcn refinement pass.

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function ExerciseMenu({
  exerciseName,
  onAddNote,
  onAddWarmupSet,
  onReplace,
  onRename,
  onRemove,
}: {
  exerciseName: string;
  onAddNote: () => void;
  onAddWarmupSet: () => void;
  onReplace: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(exerciseName);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onAddNote}>Add note</DropdownMenuItem>
          <DropdownMenuItem onClick={onAddWarmupSet}>Add warm-up set</DropdownMenuItem>
          <DropdownMenuItem onClick={onReplace}>Replace exercise</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setName(exerciseName);
              setRenameOpen(true);
            }}
          >
            Rename exercise
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            Remove exercise
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename exercise</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={() => {
                if (name.trim()) onRename(name.trim());
                setRenameOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
