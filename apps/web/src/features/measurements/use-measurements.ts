import { useQuery } from "@tanstack/react-query";

import { getMeasurements } from "@/data/client";

export function useMeasurements() {
  return useQuery({ queryKey: ["measurements"], queryFn: getMeasurements });
}
