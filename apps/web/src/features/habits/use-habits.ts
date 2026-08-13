import { useQuery } from "@tanstack/react-query";

import { getHabits } from "@/data/client";

export function useHabits() {
  return useQuery({ queryKey: ["habits"], queryFn: getHabits });
}
