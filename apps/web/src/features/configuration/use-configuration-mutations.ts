import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { updateConfiguration } from "@/data/client";
import type { Configuration } from "@/data/schemas/configuration";

const CONFIGURATION_KEY = ["configuration"];

// A plain optimistic-update + rollback, no undo-toast affordance — unlike
// measurements/habits/foods, undoing a settings edit by just editing the
// form back is trivial, so forcing the undo-toast pattern here would be
// over-fitting it.
export function useUpdateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Configuration) => updateConfiguration(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: CONFIGURATION_KEY });
      const previous = queryClient.getQueryData<Configuration>(CONFIGURATION_KEY);
      queryClient.setQueryData<Configuration>(CONFIGURATION_KEY, input);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(CONFIGURATION_KEY, context.previous);
      toastManager.add({ title: "Failed to save settings", timeout: 4000 });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Configuration>(CONFIGURATION_KEY, updated);
      toastManager.add({ title: "SETTINGS SAVED", timeout: 3000 });
    },
  });
}
