import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Single shared QueryClient for the app.
// Exported so individual hooks can call queryClient.invalidateQueries() directly
// (e.g. StudentAttemptsProvider calls it after quiz completion).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes. Navigating between pages within
      // that window will use the in-memory cache and skip the network entirely.
      staleTime: 2 * 60 * 1000,
      // Keep unused data in the cache for 5 minutes before GC.
      gcTime: 5 * 60 * 1000,
      // One automatic retry on failure with exponential back-off handled by
      // TanStack Query's default retry delay (1 s, 2 s, …).
      retry: 1,
      // Re-fetch on window focus so returning to the tab always shows fresh data
      // without requiring a full page reload.
      refetchOnWindowFocus: true,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
