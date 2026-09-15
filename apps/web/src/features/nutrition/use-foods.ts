import { useQuery } from "@tanstack/react-query";

import { getFoods } from "@/data/client";

export function useFoods() {
  return useQuery({ queryKey: ["foods"], queryFn: getFoods });
}
