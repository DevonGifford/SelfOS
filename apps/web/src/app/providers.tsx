import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ToastProvider } from "@/components/ui/toast";
import { ApiError } from "@/data/http";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A dead session doesn't get better on retry — parseOrThrow (data/http.ts)
      // already redirects to /login on the first 401, so retrying is pure
      // waste, not a safety net (ticket 09 §4).
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
