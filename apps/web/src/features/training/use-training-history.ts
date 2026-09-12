import { useQuery } from "@tanstack/react-query";

import { getTrainingHistory } from "@/data/client";

export function useTrainingHistory() {
  return useQuery({ queryKey: ["training-history"], queryFn: getTrainingHistory });
}
