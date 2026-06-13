const MIN_ACTIVE = 3;
const MAX_ACTIVE = 10;

export function validateName(name: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (name.trim() === "") errors.name = "required";
  return errors;
}

// Same instant-feedback pre-check the server enforces authoritatively
// (apps/api/internal/habits/handlers.go) — mirrors measurements'
// validate()/validate.go split.
export function validateActiveChange(
  nextActive: boolean,
  currentActive: boolean,
  activeCount: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (nextActive === currentActive) return errors;

  if (nextActive && activeCount + 1 > MAX_ACTIVE) {
    errors.active = `cannot exceed ${MAX_ACTIVE} active habits`;
  }
  if (!nextActive && activeCount - 1 < MIN_ACTIVE) {
    errors.active = `at least ${MIN_ACTIVE} habits must stay active`;
  }

  return errors;
}
