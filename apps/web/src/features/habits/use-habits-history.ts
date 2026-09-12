import { useQuery } from "@tanstack/react-query";

import { getHabitsHistory } from "@/data/client";

export function useHabitsHistory() {
  return useQuery({ queryKey: ["habits-history"], queryFn: getHabitsHistory });
}
