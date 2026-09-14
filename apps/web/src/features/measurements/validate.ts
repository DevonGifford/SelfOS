// today is passed in rather than read from `new Date()` here, so tests can
// just pass a fixed string instead of mocking the clock.
export function validate(date: string, kg: string, today: string): Record<string, string> {
  const errors: Record<string, string> = {};

  const kgNumber = Number(kg);
  if (kg.trim() === "" || Number.isNaN(kgNumber) || kgNumber <= 0) {
    errors.kg = "must be positive";
  }

  if (date.trim() === "") {
    errors.date = "required";
  } else if (date > today) {
    errors.date = "cannot be in the future";
  }

  return errors;
}
