import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { ProfilePage } from '@features/account/pages/profile'

function setup() {
  const session = fakeSession({ status: 'authenticated', user: fakeUser() })
  renderRoute(<ProfilePage />, { session, path: '/conta/perfil' })
  return session
}

describe('ProfilePage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the account header and the current e-mail', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
    expect(screen.getByText(/Membro desde/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Lima')
    const tabs = within(screen.getByRole('navigation', { name: 'Seções da conta' }))
    expect(tabs.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
    expect(tabs.getByRole('link', { name: 'Privacidade e dados' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('saves a new name and updates the session', async () => {
    const fetchMock = stubApi({
      'PATCH /account': () => jsonResponse(200, fakeUser({ name: 'Ana Souza' })),
    })
    const session = setup()
    const user = userEvent.setup()
    const save = screen.getByRole('button', { name: 'Salvar nome' })
    expect(save).toBeDisabled()

    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'Ana Souza')
    await user.click(save)

    await waitFor(() =>
      expect(session.setUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Souza' })),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ name: 'Ana Souza' })
    expect(await screen.findByText('Nome atualizado.')).toBeInTheDocument()
  })

  it('changes the e-mail with the password', async () => {
    const fetchMock = stubApi({
      'PUT /account/email': () => jsonResponse(200, fakeUser({ email: 'nova@example.com' })),
    })
    const session = setup()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Novo e-mail'), 'nova@example.com')
    await user.type(screen.getByLabelText('Senha atual'), 'uma senha longa')
    await user.click(screen.getByRole('button', { name: 'Alterar e-mail' }))

    await waitFor(() => expect(session.setUser).toHaveBeenCalled())
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'nova@example.com',
      password: 'uma senha longa',
    })
  })

  it('shows a wrong password returned by the API', async () => {
    stubApi({
      'PUT /account/email': () =>
        jsonResponse(403, { code: 'invalid_password', message: 'Senha incorreta.' }),
    })
    setup()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Novo e-mail'), 'nova@example.com')
    await user.type(screen.getByLabelText('Senha atual'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Alterar e-mail' }))

    expect(await screen.findByText('Senha incorreta.')).toBeInTheDocument()
  })

  it('validates the new e-mail and requires the password', async () => {
    setup()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Novo e-mail'), 'invalido')
    await user.click(screen.getByRole('button', { name: 'Alterar e-mail' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })
})
