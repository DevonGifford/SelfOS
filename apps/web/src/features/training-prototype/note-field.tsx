// PROTOTYPE — one shared note editing/display pattern for both session-level
// and exercise-level notes, so there's a single interaction model
// (preview → click → edit dialog → save → preview) rather than two. Answers
// ticket 02's note-unification refinement pass.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function NoteEditorDialog({
  open,
  onOpenChange,
  title,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Reset the draft to the saved value on the transition into "open", per
  // React's own "adjusting state during render" pattern — rather than an
  // effect — so an edit in progress isn't clobbered by something else
  // updating the underlying note while the dialog is already open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  function save() {
    onSave(draft.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Note…"
          rows={5}
        />
        <DialogFooter>
          {value ? (
            <Button
              variant="outline"
              onClick={() => {
                onSave("");
                onOpenChange(false);
              }}
            >
              Clear
            </Button>
          ) : null}
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotePreview({
  note,
  onClick,
  lineClamp = 2,
  className = "",
}: {
  note: string;
  onClick: () => void;
  lineClamp?: 1 | 2;
  className?: string;
}) {
  if (!note) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full whitespace-pre-wrap text-left text-xs text-muted-foreground hover:text-foreground ${
        lineClamp === 1 ? "line-clamp-1" : "line-clamp-2"
      } ${className}`}
    >
      {note}
    </button>
  );
}
