import { screen, waitFor } from '@testing-library/react'

import { fakeSession, renderRoute, fakeUser } from '@shared/test/render.helper'
import { GuestOnly } from '@features/auth/components/guest-only'
import { RequireAuth } from '@features/auth/components/require-auth'

const user = fakeUser({ id: '1', email: 'ana@example.com', name: 'Ana' })

describe('RequireAuth', () => {
  it('shows a spinner while the session loads', () => {
    renderRoute(<RequireAuth />, { session: fakeSession({ status: 'loading' }) })

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })

  it('sends anonymous users to the login page, remembering where they were', async () => {
    const { router } = renderRoute(<RequireAuth />, { path: '/propostas' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.state).toEqual({ from: '/propostas' })
  })

  it('renders the page for authenticated users', () => {
    renderRoute(<RequireAuth />, {
      session: fakeSession({ status: 'authenticated', user }),
      extraRoutes: [],
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('GuestOnly', () => {
  it('sends authenticated users to the app', async () => {
    const { router } = renderRoute(<GuestOnly />, {
      path: '/entrar',
      session: fakeSession({ status: 'authenticated', user }),
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('shows a spinner while the session loads', () => {
    renderRoute(<GuestOnly />, { path: '/entrar', session: fakeSession({ status: 'loading' }) })

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })
})
