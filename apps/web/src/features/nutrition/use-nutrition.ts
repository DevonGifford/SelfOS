import { useQuery } from "@tanstack/react-query";

import { getNutrition } from "@/data/client";

export function useNutrition() {
  return useQuery({ queryKey: ["nutrition"], queryFn: getNutrition });
}
