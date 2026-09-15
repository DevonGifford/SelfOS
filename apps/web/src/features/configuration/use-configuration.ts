import { useQuery } from "@tanstack/react-query";

import { getConfiguration } from "@/data/client";

export function useConfiguration() {
  return useQuery({ queryKey: ["configuration"], queryFn: getConfiguration });
}
