import { WeightEntrySchema, WeightSchema, type WeightEntry } from "@/data/schemas/weight";

const MEASUREMENTS_URL = "/api/measurements";

type MeasurementInput = {
  date: string;
  kg: number;
};

// Structured field-level errors from the API (decision 03) surface here so
// callers (the edit drawer, later) can show inline per-field messages
// instead of a generic failure.
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, body: unknown) {
    const fieldErrors = isErrorBody(body) ? body.errors : {};
    super(Object.values(fieldErrors)[0] ?? `Request failed with status ${status}`);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function isErrorBody(body: unknown): body is { errors: Record<string, string> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    typeof (body as { errors: unknown }).errors === "object"
  );
}

async function parseOrThrow(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body;
}

export async function getMeasurements(): Promise<WeightEntry[]> {
  const response = await fetch(MEASUREMENTS_URL);
  const body = await parseOrThrow(response);
  return WeightSchema.parse(body);
}

export async function createMeasurement(input: MeasurementInput): Promise<WeightEntry> {
  const response = await fetch(MEASUREMENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WeightEntrySchema.parse(body);
}

export async function updateMeasurement(id: string, input: MeasurementInput): Promise<WeightEntry> {
  const response = await fetch(`${MEASUREMENTS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseOrThrow(response);
  return WeightEntrySchema.parse(body);
}

export async function deleteMeasurement(id: string): Promise<void> {
  const response = await fetch(`${MEASUREMENTS_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body);
  }
}
