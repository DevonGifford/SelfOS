import { useQuery } from "@tanstack/react-query";

import { getHabitEntries } from "@/data/client";

export function useHabitEntries() {
  return useQuery({ queryKey: ["habit-entries"], queryFn: getHabitEntries });
}
