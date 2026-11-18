import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ApiError } from '@shared/api/http.client'
import { fakeSession, renderRoute } from '@shared/test/render.helper'
import { RegisterPage } from '@features/auth/pages/register'

async function fill(name: string, email: string, password: string) {
  if (name) await userEvent.type(screen.getByLabelText('Nome'), name)
  if (email) await userEvent.type(screen.getByLabelText('E-mail'), email)
  if (password) await userEvent.type(screen.getByLabelText('Senha'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('RegisterPage', () => {
  it('requires a name and a password with at least 8 characters', async () => {
    renderRoute(<RegisterPage />, { path: '/cadastro' })

    await fill('', 'ana@example.com', 'curta')

    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument()
  })

  it('creates the account and opens the app', async () => {
    const session = fakeSession()
    const { router } = renderRoute(<RegisterPage />, { session, path: '/cadastro' })

    await fill('Ana Lima', 'ana@example.com', 'uma senha longa')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(session.register).toHaveBeenCalledWith({
      name: 'Ana Lima',
      email: 'ana@example.com',
      password: 'uma senha longa',
    })
  })

  it('shows when the e-mail is already taken', async () => {
    const session = fakeSession({
      register: vi.fn(async () => {
        throw new ApiError(409, 'email_taken', 'Já existe uma conta com este e-mail.')
      }),
    })
    renderRoute(<RegisterPage />, { session, path: '/cadastro' })

    await fill('Ana Lima', 'ana@example.com', 'uma senha longa')

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
  })
})
