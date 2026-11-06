import { QueryClient } from "@tanstack/react-query"

export const STALE_TIME = 5 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: STALE_TIME } },
})
