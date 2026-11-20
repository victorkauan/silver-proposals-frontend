import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { DataPage } from '@features/account/pages/data'

function setup(overrides = {}) {
  const session = fakeSession({ status: 'authenticated', user: fakeUser(overrides) })
  renderRoute(<DataPage />, { session, path: '/conta/dados' })
  return { session }
}

describe('DataPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows when the current privacy notice was accepted', () => {
    setup()

    expect(screen.getByText(/Versão atual aceita em/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ler o aviso/ })).toHaveAttribute(
      'href',
      '/privacidade',
    )
  })

  it('accepts a newer privacy notice', async () => {
    stubApi({ 'POST /account/privacy-acceptance': () => jsonResponse(200, fakeUser()) })
    const { session } = setup({ privacy_up_to_date: false, privacy_accepted_at: null })

    expect(screen.getByText(/ainda não aceitou/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    await waitFor(() => expect(session.setUser).toHaveBeenCalled())
  })

  it('downloads the exported data as a file', async () => {
    stubApi({
      'GET /account/export': () =>
        new Response('{"account":{}}', { headers: { 'Content-Type': 'application/json' } }),
    })
    const createObjectURL = vi.fn(() => 'blob:dados')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Exportar meus dados' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:dados')
    expect(await screen.findByText('Seus dados foram exportados.')).toBeInTheDocument()
  })

  it('shows an export error', async () => {
    stubApi({
      'GET /account/export': () =>
        jsonResponse(429, { code: 'rate_limited', message: 'Muitas tentativas.' }),
    })
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Exportar meus dados' }))

    expect(await screen.findByText('Muitas tentativas.')).toBeInTheDocument()
  })

  it('deletes the account only with the password and the confirmation word', async () => {
    const fetchMock = stubApi({ 'POST /account/delete': () => new Response(null, { status: 204 }) })
    const { session } = setup()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))
    await user.type(screen.getByLabelText('Senha atual'), 'uma senha longa')
    await user.type(screen.getByLabelText(/Para confirmar/), 'excluir')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByText('Digite EXCLUIR para confirmar.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText(/Para confirmar/))
    await user.type(screen.getByLabelText(/Para confirmar/), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    await waitFor(() => expect(session.endSession).toHaveBeenCalledWith('account_deleted'))
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      password: 'uma senha longa',
    })
  })

  it('keeps the dialog open with the error when the password is wrong', async () => {
    stubApi({
      'POST /account/delete': () =>
        jsonResponse(403, { code: 'invalid_password', message: 'Senha incorreta.' }),
    })
    const { session } = setup()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))
    await user.type(screen.getByLabelText('Senha atual'), 'errada')
    await user.type(screen.getByLabelText(/Para confirmar/), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByText('Senha incorreta.')).toBeInTheDocument()
    expect(session.endSession).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByText('Senha incorreta.')).not.toBeInTheDocument())
  })
})
