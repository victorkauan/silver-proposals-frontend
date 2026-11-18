import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { ThemeProvider } from '@shared/components/theme-provider'
import { Toaster } from '@shared/components/ui/sonner'
import { routes } from '@features/app/app.routes'
import { SessionProvider } from '@features/auth/components/session-provider'

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  )
  const [router] = useState(() => createBrowserRouter(routes))

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
