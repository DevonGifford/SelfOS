import { useQuery } from "@tanstack/react-query";

import { getTraining } from "@/data/client";

export function useTraining() {
  return useQuery({ queryKey: ["training"], queryFn: getTraining });
}
