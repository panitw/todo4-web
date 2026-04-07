'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { redirectingToLogin } from '@/lib/api/client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s — matches UI polling interval per architecture
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (redirectingToLogin) return false
              if ((error as { status?: number }).status === 401) return false
              return failureCount < 3
            },
          },
          mutations: {
            retry: (failureCount, error) => {
              if (redirectingToLogin) return false
              if ((error as { status?: number }).status === 401) return false
              return failureCount < 1
            },
            retryDelay: 3000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
