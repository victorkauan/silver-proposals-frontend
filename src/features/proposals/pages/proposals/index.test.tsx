import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, renderRoute, fakeUser } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { ProposalsPage } from '@features/proposals/pages/proposals'

const user = fakeUser({ id: '1', email: 'ana@example.com', name: 'Ana Lima' })
const session = () => fakeSession({ status: 'authenticated', user })
const empty = () => jsonResponse(200, { items: [], total: 0 })

const proposals = {
  items: [
    {
      id: 'p-1',
      title: 'Site institucional',
      client_name: 'Padaria Pão Quente',
      role: 'owner',
      status: 'shared',
      archived_at: null,
      updated_at: '2026-11-17T12:00:00Z',
    },
    {
      id: 'p-2',
      title: 'App de pedidos',
      client_name: 'Mercado Bom Preço',
      role: 'editor',
      status: 'generated',
      archived_at: null,
      updated_at: '2026-11-16T12:00:00Z',
    },
  ],
  total: 2,
}

describe('ProposalsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows the empty proposal list and its creation link', async () => {
    stubApi({ 'GET /proposals': empty })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })
    expect(screen.getByRole('heading', { name: 'Propostas' })).toBeInTheDocument()
    expect(screen.getByLabelText('Carregando propostas')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar primeira proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova',
    )
  })

  it('lists the proposals with links', async () => {
    stubApi({ 'GET /proposals': () => jsonResponse(200, proposals) })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })

    const first = await screen.findByRole('link', { name: /Site institucional/ })
    expect(first).toHaveAttribute('href', '/propostas/p-1')
    expect(first).toHaveTextContent('Padaria Pão Quente')
    expect(screen.getByRole('link', { name: /App de pedidos/ })).toHaveTextContent('Editor')
    expect(screen.getByRole('link', { name: 'Nova proposta' })).toBeInTheDocument()
  })

  it('shows the real status of each proposal', async () => {
    stubApi({ 'GET /proposals': () => jsonResponse(200, proposals) })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })

    const first = await screen.findByRole('link', { name: /Site institucional/ })
    expect(first).toHaveTextContent('Compartilhada')
    expect(screen.getByRole('link', { name: /App de pedidos/ })).toHaveTextContent('Gerada')
  })

  it('searches on the server and starts again from the first page', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return url.searchParams.get('q') === 'xyz'
          ? jsonResponse(200, { items: [], total: 0 })
          : jsonResponse(200, proposals)
      },
    })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })

    const search = await screen.findByRole('searchbox', { name: 'Buscar propostas' })
    await userEvent.type(search, 'xyz')

    expect(await screen.findByText('Nenhuma proposta encontrada para “xyz”.')).toBeInTheDocument()
    const last = urls.at(-1)
    expect(last?.searchParams.get('q')).toBe('xyz')
    expect(last?.searchParams.get('offset')).toBe('0')
    expect(screen.getByRole('heading', { name: /Resultados da busca/ })).toBeInTheDocument()
    expect(urls.some((url) => url.searchParams.get('q') === 'x')).toBe(false)
  })

  it('pages through the list on the server', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return jsonResponse(200, { ...proposals, total: 45 })
      },
    })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })

    expect(await screen.findByText('1–5 de 45')).toBeInTheDocument()
    expect(urls[0].searchParams.get('limit')).toBe('5')
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(await screen.findByText('6–10 de 45')).toBeInTheDocument()
    expect(urls.at(-1)?.searchParams.get('offset')).toBe('5')
    expect(urls.at(-1)?.searchParams.get('limit')).toBe('5')
  })

  it('changes the page size and starts again from the first page', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return jsonResponse(200, { ...proposals, total: 45 })
      },
    })
    const { router } = renderRoute(<ProposalsPage />, {
      session: session(),
      path: '/propostas',
      initialEntries: ['/propostas?pagina=3'],
    })

    expect(await screen.findByText('11–15 de 45')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('combobox', { name: 'Propostas por página' }))
    await userEvent.click(await screen.findByRole('option', { name: '20' }))

    expect(await screen.findByText('1–20 de 45')).toBeInTheDocument()
    expect(urls.at(-1)?.searchParams.get('limit')).toBe('20')
    expect(urls.at(-1)?.searchParams.get('offset')).toBe('0')
    expect(router.state.location.search).toBe('?por_pagina=20')
  })

  it('ignores a page size that is not offered', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return jsonResponse(200, { ...proposals, total: 45 })
      },
    })
    renderRoute(<ProposalsPage />, {
      session: session(),
      path: '/propostas',
      initialEntries: ['/propostas?por_pagina=1000'],
    })

    expect(await screen.findByText('1–5 de 45')).toBeInTheDocument()
    expect(urls[0].searchParams.get('limit')).toBe('5')
    expect(screen.getByRole('combobox', { name: 'Propostas por página' })).toHaveTextContent('5')
  })

  it('restores the search and page from the address', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return jsonResponse(200, { ...proposals, total: 45 })
      },
    })
    renderRoute(<ProposalsPage />, {
      session: session(),
      path: '/propostas',
      initialEntries: ['/propostas?q=pão&pagina=3&por_pagina=20'],
    })

    expect(await screen.findByText('41–45 de 45')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar propostas' })).toHaveValue('pão')
    expect(urls[0].searchParams.get('q')).toBe('pão')
    expect(urls[0].searchParams.get('offset')).toBe('40')
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled()
  })

  it('goes back to the last page when the requested one is past the end', async () => {
    const urls: URL[] = []
    stubApi({
      'GET /proposals': (_init, url) => {
        urls.push(url)
        return url.searchParams.get('offset') === '25'
          ? jsonResponse(200, { items: [], total: 25 })
          : jsonResponse(200, { ...proposals, total: 25 })
      },
    })
    renderRoute(<ProposalsPage />, {
      session: session(),
      path: '/propostas',
      initialEntries: ['/propostas?pagina=6'],
    })

    expect(await screen.findByText('21–25 de 25')).toBeInTheDocument()
    expect(urls.at(-1)?.searchParams.get('offset')).toBe('20')
  })

  it('shows the API error and retries', async () => {
    let calls = 0
    stubApi({
      'GET /proposals': () =>
        ++calls === 1
          ? jsonResponse(500, { code: 'internal_error', message: 'Erro interno. Tente novamente.' })
          : empty(),
    })
    renderRoute(<ProposalsPage />, { session: session(), path: '/propostas' })

    expect(await screen.findByText('Erro interno. Tente novamente.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
  })
})
