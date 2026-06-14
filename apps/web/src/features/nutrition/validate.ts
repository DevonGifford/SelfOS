export function validateFoodName(name: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (name.trim() === "") errors.name = "required";
  return errors;
}

export function validateServingLabel(label: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (label.trim() === "") errors.servingLabel = "required";
  return errors;
}

export function validateQuantity(quantity: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const value = Number(quantity);
  if (quantity.trim() === "" || Number.isNaN(value) || value <= 0) {
    errors.quantity = "must be positive";
  }
  return errors;
}
