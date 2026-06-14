import { useQuery } from "@tanstack/react-query";

import { getFoodEntries } from "@/data/client";

export function useFoodEntries() {
  return useQuery({ queryKey: ["food-entries"], queryFn: getFoodEntries });
}
