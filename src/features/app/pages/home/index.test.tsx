import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { HomePage } from '@features/app/pages/home'

const user = { id: '1', email: 'ana@example.com', name: 'Ana Lima' }
const session = () => fakeSession({ status: 'authenticated', user })
const empty = () => jsonResponse(200, { items: [], total: 0 })

const proposals = {
  items: [
    {
      id: 'p-1',
      title: 'Site institucional',
      client_name: 'Padaria Pão Quente',
      role: 'owner',
      archived_at: null,
      updated_at: '2026-11-17T12:00:00Z',
    },
    {
      id: 'p-2',
      title: 'App de pedidos',
      client_name: 'Mercado Bom Preço',
      role: 'editor',
      archived_at: null,
      updated_at: '2026-11-16T12:00:00Z',
    },
  ],
  total: 2,
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('greets the user and shows the empty state with getting-started steps', async () => {
    stubApi({ 'GET /proposals': empty })
    renderRoute(<HomePage />, { session: session() })

    expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
    expect(screen.getByLabelText('Carregando propostas')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
    const steps = within(screen.getByRole('region', { name: 'Primeiros passos' }))
    expect(
      steps.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Escreva o briefing', 'Gere com IA', 'Edite e compartilhe'])
    expect(screen.getByRole('link', { name: 'Criar primeira proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova',
    )
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('lists the proposals with links, and hides the getting-started steps', async () => {
    stubApi({ 'GET /proposals': () => jsonResponse(200, proposals) })
    renderRoute(<HomePage />, { session: session() })

    const first = await screen.findByRole('link', { name: /Site institucional/ })
    expect(first).toHaveAttribute('href', '/propostas/p-1')
    expect(first).toHaveTextContent('Padaria Pão Quente')
    expect(screen.getByRole('link', { name: /App de pedidos/ })).toHaveTextContent('Editor')
    expect(screen.getByRole('link', { name: 'Nova proposta' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Primeiros passos' })).not.toBeInTheDocument()
  })

  it('filters the list by title or client, ignoring accents', async () => {
    stubApi({ 'GET /proposals': () => jsonResponse(200, proposals) })
    renderRoute(<HomePage />, { session: session() })

    const search = await screen.findByRole('searchbox', { name: 'Buscar propostas' })
    await userEvent.type(search, 'pao')

    expect(screen.getByRole('link', { name: /Site institucional/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /App de pedidos/ })).not.toBeInTheDocument()

    await userEvent.clear(search)
    await userEvent.type(search, 'xyz')
    expect(screen.getByText('Nenhuma proposta encontrada para “xyz”.')).toBeInTheDocument()
  })

  it('shows the API error and retries', async () => {
    let calls = 0
    stubApi({
      'GET /proposals': () =>
        ++calls === 1
          ? jsonResponse(500, { code: 'internal_error', message: 'Erro interno. Tente novamente.' })
          : empty(),
    })
    renderRoute(<HomePage />, { session: session() })

    expect(await screen.findByText('Erro interno. Tente novamente.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
  })

  it('logs out from the user menu', async () => {
    stubApi({ 'GET /proposals': empty })
    const current = session()
    renderRoute(<HomePage />, { session: current })

    await userEvent.click(screen.getByText('ana@example.com'))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(current.logout).toHaveBeenCalledOnce()
  })

  it('switches to the dark theme and remembers it', async () => {
    stubApi({ 'GET /proposals': empty })
    renderRoute(<HomePage />, { session: session() })

    await userEvent.click(screen.getByText('ana@example.com'))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Escuro' }))

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('silver-proposals-theme')).toBe('dark')
  })
})
