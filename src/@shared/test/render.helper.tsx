import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

import { ThemeProvider } from '@shared/components/theme-provider'
import { Toaster } from '@shared/components/ui/sonner'
import type { User } from '@features/auth/auth.type'
import { type Session, SessionContext } from '@features/auth/session.context'

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'ana@example.com',
    name: 'Ana Lima',
    created_at: '2026-11-01T12:00:00Z',
    privacy_up_to_date: true,
    privacy_accepted_at: '2026-11-01T12:00:00Z',
    two_factor_enabled: false,
    ...overrides,
  }
}

export function fakeSession(overrides: Partial<Session> = {}): Session {
  return {
    status: 'anonymous',
    user: null,
    notice: null,
    login: vi.fn(async () => ({ status: 'signed_in' as const })),
    completeTwoFactor: vi.fn(async () => {}),
    register: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    setUser: vi.fn(),
    endSession: vi.fn(),
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
          <Toaster />
        </SessionContext>
      </QueryClientProvider>
    </ThemeProvider>,
  )
  return { router, session }
}
