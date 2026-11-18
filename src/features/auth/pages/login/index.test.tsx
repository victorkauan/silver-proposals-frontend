import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ApiError } from '@shared/api/http.client'
import { fakeSession, renderRoute } from '@shared/test/render.helper'
import { LoginPage } from '@features/auth/pages/login'

describe('LoginPage', () => {
  it('shows validation errors in pt-BR', async () => {
    renderRoute(<LoginPage />, { path: '/entrar' })

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('logs in and goes back to the page that asked for it', async () => {
    const session = fakeSession()
    const { router } = renderRoute(<LoginPage />, {
      session,
      path: '/entrar',
      initialEntries: [{ pathname: '/entrar', state: { from: '/propostas' } }],
    })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'uma senha longa')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/propostas'))
    expect(session.login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'uma senha longa',
    })
  })

  it('shows the API error message', async () => {
    const session = fakeSession({
      login: vi.fn(async () => {
        throw new ApiError(401, 'invalid_credentials', 'E-mail ou senha inválidos.')
      }),
    })
    renderRoute(<LoginPage />, { session, path: '/entrar' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })

  it('disables the button while logging in', async () => {
    const session = fakeSession({ login: vi.fn(() => new Promise<void>(() => {})) })
    renderRoute(<LoginPage />, { session, path: '/entrar' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'uma senha longa')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Entrar/ })).toBeDisabled())
  })
})
