import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { ProposalHistoryPage } from '@features/proposals/pages/proposal-history'
import type { ProposalDetail, VersionDetail } from '@features/proposals/proposal.type'

const proposal: ProposalDetail = {
  id: 'p-1',
  title: 'Site institucional',
  client_name: 'Padaria',
  role: 'owner',
  status: 'edited',
  archived_at: null,
  updated_at: '2026-11-18T12:00:00Z',
  briefing: 'b',
  content: '# Proposta\n\nPrazo: 6 semanas\n',
  version: 2,
  created_at: '2026-11-18T10:00:00Z',
}

const versions: VersionDetail[] = [
  {
    number: 2,
    source: 'edited',
    author_name: 'Ana Lima',
    content_chars: 30,
    created_at: '2026-11-18T12:00:00Z',
    content: '# Proposta\n\nPrazo: 6 semanas\n',
  },
  {
    number: 1,
    source: 'generated',
    author_name: 'Ana Lima',
    content_chars: 30,
    created_at: '2026-11-18T11:00:00Z',
    content: '# Proposta\n\nPrazo: [A DEFINIR]\n',
  },
]

function routes(overrides: Parameters<typeof stubApi>[0] = {}) {
  return stubApi({
    'GET /proposals/p-1': () => jsonResponse(200, proposal),
    'GET /proposals/p-1/versions': () =>
      jsonResponse(200, { items: versions.map(({ content: _c, ...v }) => v), total: 2 }),
    'GET /proposals/p-1/versions/1': () => jsonResponse(200, versions[1]),
    'GET /proposals/p-1/versions/2': () => jsonResponse(200, versions[0]),
    ...overrides,
  })
}

function render() {
  return renderRoute(<ProposalHistoryPage />, {
    path: '/propostas/:id/historico',
    initialEntries: ['/propostas/p-1/historico'],
    extraRoutes: [{ path: '/propostas/:id', element: <p>detalhe</p> }],
  })
}

describe('ProposalHistoryPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lists the versions with their origin and shows the latest one', async () => {
    routes()
    render()

    const list = within(await screen.findByRole('navigation', { name: 'Versões' }))
    const items = list.getAllByRole('button')
    expect(items[0]).toHaveTextContent('Versão 2Atual')
    expect(items[0]).toHaveTextContent('Editada por Ana Lima')
    expect(items[1]).toHaveTextContent('Gerada pela IA')
    expect(await screen.findByText('Prazo: 6 semanas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restaurar esta versão' })).not.toBeInTheDocument()
  })

  it('shows what changed compared with the previous version', async () => {
    routes()
    render()

    await userEvent.click(await screen.findByRole('button', { name: 'Alterações' }))

    const table = await screen.findByRole('table', { name: 'Alterações' })
    expect(within(table).getByText('Prazo: [A DEFINIR]').closest('[role=row]')).toHaveAttribute(
      'data-kind',
      'removed',
    )
    expect(within(table).getByText('Prazo: 6 semanas').closest('[role=row]')).toHaveAttribute(
      'data-kind',
      'added',
    )
    expect(screen.getByText('Comparada com a versão 1.')).toBeInTheDocument()
  })

  it('restores an older version after confirmation', async () => {
    const fetchMock = routes({
      'POST /proposals/p-1/versions/1/restore': () =>
        jsonResponse(200, { ...proposal, content: versions[1].content, version: 3 }),
    })
    const { router } = render()

    const list = within(await screen.findByRole('navigation', { name: 'Versões' }))
    await userEvent.click(list.getByRole('button', { name: /Versão 1/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Restaurar esta versão' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Restaurar a versão 1?' })
    expect(dialog).toHaveTextContent('O conteúdo dela vira a versão 3')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Restaurar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/propostas/p-1'))
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/versions/1/restore'))).toBe(
      true,
    )
  })

  it('does not offer restore to viewers', async () => {
    routes({ 'GET /proposals/p-1': () => jsonResponse(200, { ...proposal, role: 'viewer' }) })
    render()

    const list = within(await screen.findByRole('navigation', { name: 'Versões' }))
    await userEvent.click(list.getByRole('button', { name: /Versão 1/ }))

    expect(await screen.findByText('Prazo:')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restaurar esta versão' })).not.toBeInTheDocument()
  })

  it('explains an empty history', async () => {
    routes({ 'GET /proposals/p-1/versions': () => jsonResponse(200, { items: [], total: 0 }) })
    render()

    expect(await screen.findByText('Nenhuma versão ainda')).toBeInTheDocument()
  })

  it('shows load errors with a retry', async () => {
    routes({
      'GET /proposals/p-1/versions': () =>
        jsonResponse(500, { code: 'internal_error', message: 'Erro interno.' }),
    })
    render()

    expect(await screen.findByText('Erro interno.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
