import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { ShareDialog } from '@features/proposals/components/share-dialog'
import type { ShareLink } from '@features/proposals/proposal.type'

const active: ShareLink = {
  id: 'l-1',
  expires_at: '2099-01-10T12:00:00Z',
  revoked_at: null,
  created_at: '2026-11-18T12:00:00Z',
  active: true,
}
const revoked: ShareLink = {
  id: 'l-2',
  expires_at: '2099-01-10T12:00:00Z',
  revoked_at: '2026-11-18T13:00:00Z',
  created_at: '2026-11-17T12:00:00Z',
  active: false,
}

describe('ShareDialog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a link with the chosen expiration and copies it once', async () => {
    let links: ShareLink[] = []
    const fetchMock = stubApi({
      'GET /proposals/p-1/share-links': () => jsonResponse(200, links),
      'POST /proposals/p-1/share-links': () => {
        links = [active]
        return jsonResponse(201, { ...active, token: 'tok-123' })
      },
    })
    const user = userEvent.setup()
    renderRoute(<ShareDialog proposalId="p-1" />)

    await user.click(screen.getByRole('button', { name: 'Compartilhar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Compartilhar proposta' })
    expect(await within(dialog).findByText('Nenhum link criado ainda.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '30 dias' }))
    await user.click(within(dialog).getByRole('button', { name: 'Criar link' }))

    const field = await within(dialog).findByLabelText('Link de compartilhamento')
    expect(field).toHaveValue(`${window.location.origin}/p/tok-123`)
    await user.click(within(dialog).getByRole('button', { name: 'Copiar' }))
    await expect(navigator.clipboard.readText()).resolves.toBe(
      `${window.location.origin}/p/tok-123`,
    )
    expect(await screen.findByText('Link copiado')).toBeInTheDocument()
    expect(within(dialog).getByText('Ativo')).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ expires_in_days: 30 })
  })

  it('revokes an active link after confirmation, and shows past links', async () => {
    let links = [active, revoked]
    const fetchMock = stubApi({
      'GET /proposals/p-1/share-links': () => jsonResponse(200, links),
      'DELETE /proposals/p-1/share-links/l-1': () => {
        links = [{ ...active, active: false, revoked_at: '2026-11-18T14:00:00Z' }, revoked]
        return new Response(null, { status: 204 })
      },
    })
    renderRoute(<ShareDialog proposalId="p-1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Compartilhar proposta' })
    expect(await within(dialog).findByText('Revogado')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revogar' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Link revogado')).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getAllByText('Revogado')).toHaveLength(2))
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true)
  })

  it('shows the API error when creating fails', async () => {
    stubApi({
      'GET /proposals/p-1/share-links': () => jsonResponse(200, []),
      'POST /proposals/p-1/share-links': () =>
        jsonResponse(403, { code: 'forbidden', message: 'Você não tem permissão para esta ação.' }),
    })
    renderRoute(<ShareDialog proposalId="p-1" />)

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Criar link' }))

    expect(await screen.findByText('Você não tem permissão para esta ação.')).toBeInTheDocument()
  })
})
