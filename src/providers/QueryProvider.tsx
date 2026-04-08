import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** Shared QueryClient with sensible defaults for a Supabase-backed SPA. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,          // 30 s before background refetch
      gcTime: 1000 * 60 * 5,         // 5 min cache
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
