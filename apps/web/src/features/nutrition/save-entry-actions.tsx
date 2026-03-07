type SaveEntryActionsProps = {
  onLogOnce: () => void;
  onUpdateFood?: () => void;
  onSaveAsNewFood: () => void;
  disabled?: boolean;
};

// The three-way save choice shared by the Add and Edit flows: log this
// resolved entry once, overwrite the linked Food's per-serving rate, or
// spin the resolved values off into a separate reusable Food. Update Food
// only renders when there's a Food to update (always true from Add, only
// when the entry's Food hasn't been deleted from Edit).
export function SaveEntryActions({ onLogOnce, onUpdateFood, onSaveAsNewFood, disabled }: SaveEntryActionsProps) {
  return (
    <div className="border-t pt-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Save this entry</p>
      <div className="mt-2 overflow-hidden rounded-md border">
        <button
          type="button"
          onClick={onLogOnce}
          disabled={disabled}
          className="block w-full px-4 py-3 text-center text-sm font-semibold bg-foreground text-background disabled:opacity-50"
        >
          Log this once
        </button>
        {onUpdateFood && (
          <button
            type="button"
            onClick={onUpdateFood}
            disabled={disabled}
            className="block w-full border-t px-4 py-3 text-center text-sm disabled:opacity-50"
          >
            Update Food
          </button>
        )}
        <button
          type="button"
          onClick={onSaveAsNewFood}
          disabled={disabled}
          className="block w-full border-t px-4 py-3 text-center text-sm disabled:opacity-50"
        >
          Save as new food
        </button>
      </div>
    </div>
  );
}
