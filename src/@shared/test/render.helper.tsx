import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

import { ThemeProvider } from '@shared/components/theme-provider'
import { type Session, SessionContext } from '@features/auth/session.context'

export function fakeSession(overrides: Partial<Session> = {}): Session {
  return {
    status: 'anonymous',
    user: null,
    login: vi.fn(async () => {}),
    register: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    ...overrides,
  }
}

type Options = {
  session?: Session
  path?: string
  initialEntries?: Array<string | { pathname: string; state?: unknown }>
  extraRoutes?: RouteObject[]
}

export function renderRoute(element: ReactElement, options: Options = {}) {
  const path = options.path ?? '/'
  const session = options.session ?? fakeSession()
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: <p>rota: destino</p> },
      ...(options.extraRoutes ?? []),
    ],
    { initialEntries: options.initialEntries ?? [path] },
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionContext value={session}>
          <RouterProvider router={router} />
        </SessionContext>
      </QueryClientProvider>
    </ThemeProvider>,
  )
  return { router, session }
}
