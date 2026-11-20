import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setAccessToken } from '@shared/api/http.client'
import { stubApi } from '@shared/test/fetch.helper'
import { renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { PublicProposalPage } from '@features/proposals/pages/public-proposal'

const shared = {
  title: 'Site institucional',
  client_name: 'Padaria Pão Quente',
  content:
    '# Proposta comercial\n\n## Escopo\n\n- Cardápio online\n\n## Investimento\n\n[A DEFINIR]',
  updated_at: '2026-11-18T12:00:00Z',
}

function render() {
  return renderRoute(<PublicProposalPage />, { path: '/p/:token', initialEntries: ['/p/tok-123'] })
}

describe('PublicProposalPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('shows the shared proposal read-only, without sending credentials', async () => {
    setAccessToken('token-of-a-logged-in-user')
    const fetchMock = stubApi({ 'POST /public/proposals/resolve': () => jsonResponse(200, shared) })
    render()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Site institucional' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Padaria Pão Quente')).toBeInTheDocument()
    expect(screen.getByText('18 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escopo' })).toBeInTheDocument()
    const outline = within(screen.getByRole('navigation', { name: 'Sumário' }))
    expect(outline.getByRole('link', { name: 'Investimento' })).toHaveAttribute('href', '#secao-2')
    expect(screen.getByRole('button', { name: 'Imprimir / PDF' })).toBeInTheDocument()
    for (const name of [/Editar/, /Compartilhar/, /Gerar/, /Histórico/]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument()
    }
    const headers = (fetchMock.mock.calls[0][1]?.headers ?? {}) as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ token: 'tok-123' }))
  })

  it('keeps the page out of search engines and the token out of the Referer', async () => {
    stubApi({ 'POST /public/proposals/resolve': () => jsonResponse(200, shared) })
    render()

    await screen.findByRole('heading', { level: 1, name: 'Site institucional' })
    await waitFor(() => expect(document.title).toBe('Site institucional · Proposta comercial'))
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
    expect(document.querySelector('meta[name="referrer"]')).toHaveAttribute(
      'content',
      'no-referrer',
    )
  })

  it('prints the proposal', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    stubApi({ 'POST /public/proposals/resolve': () => jsonResponse(200, shared) })
    render()

    await userEvent.click(await screen.findByRole('button', { name: 'Imprimir / PDF' }))

    expect(print).toHaveBeenCalledOnce()
    print.mockRestore()
  })

  it('explains an unavailable link without technical details', async () => {
    stubApi({
      'POST /public/proposals/resolve': () =>
        jsonResponse(404, { code: 'share_link_not_found', message: 'Link inválido ou expirado.' }),
    })
    render()

    expect(
      await screen.findByRole('heading', { name: 'Este link não está disponível' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/pode ter expirado ou sido revogado/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Imprimir / PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })

  it('offers a retry for other errors', async () => {
    let calls = 0
    stubApi({
      'POST /public/proposals/resolve': () =>
        ++calls === 1
          ? jsonResponse(429, { code: 'rate_limited', message: 'Muitas tentativas. Aguarde.' })
          : jsonResponse(200, shared),
    })
    render()

    expect(await screen.findByText('Muitas tentativas. Aguarde.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Site institucional' }),
    ).toBeInTheDocument()
  })
})
