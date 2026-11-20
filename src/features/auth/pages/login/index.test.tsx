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
    const session = fakeSession({ login: vi.fn(() => new Promise<never>(() => {})) })
    renderRoute(<LoginPage />, { session, path: '/entrar' })

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'uma senha longa')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Entrar/ })).toBeDisabled())
  })

  it('waits for the second factor and returns to the requested page with a recovery code', async () => {
    const session = fakeSession({
      login: vi.fn(async () => ({ status: 'two_factor' as const, challengeToken: 'challenge' })),
    })
    const { router } = renderRoute(<LoginPage />, {
      session,
      path: '/entrar',
      initialEntries: [{ pathname: '/entrar', state: { from: '/conta/seguranca' } }],
    })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'uma senha longa')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/entrar')
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Usar um código de recuperação' }))
    await user.type(screen.getByLabelText('Código de recuperação'), 'abcde-23456')
    await user.click(screen.getByRole('button', { name: 'Verificar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/seguranca'))
    expect(session.completeTwoFactor).toHaveBeenCalledWith('challenge', 'abcde-23456')
  })

  it('returns to password entry when the challenge expires', async () => {
    const session = fakeSession({
      login: vi.fn(async () => ({ status: 'two_factor' as const, challengeToken: 'expired' })),
      completeTwoFactor: vi.fn(async () => {
        throw new ApiError(401, 'invalid_challenge', 'Entre novamente.')
      }),
    })
    renderRoute(<LoginPage />, { session, path: '/entrar' })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'uma senha longa')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await user.click(await screen.findByRole('button', { name: 'Usar um código de recuperação' }))
    await user.click(screen.getByRole('button', { name: 'Usar o app autenticador' }))
    await user.type(screen.getByLabelText('Código do app autenticador'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verificar' }))
    expect(await screen.findByText('Entre novamente.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Entrar novamente' }))
    expect(screen.getByLabelText('Senha')).toHaveValue('')
  })

  it('confirms that the account was deleted', () => {
    renderRoute(<LoginPage />, {
      path: '/entrar',
      session: fakeSession({ notice: 'account_deleted' }),
    })

    expect(screen.getByRole('status')).toHaveTextContent('Sua conta foi excluída.')
  })
})
