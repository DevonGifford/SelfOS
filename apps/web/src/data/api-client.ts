import { WeightEntrySchema, WeightSchema, type WeightEntry } from "@/data/schemas/weight";
import { parseOrThrow } from "@/data/http";

const MEASUREMENTS_URL = "/api/measurements";

type MeasurementInput = {
  date: string;
  kg: number;
};

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
  await parseOrThrow(response);
}
