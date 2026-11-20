import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import type { DashboardSummary } from '@features/app/dashboard.api'
import { HomePage } from '@features/app/pages/home'

const session = () => fakeSession({ status: 'authenticated', user: fakeUser() })
const when = '2026-11-20T12:00:00Z'
const empty: DashboardSummary = {
  proposal_counts: { draft: 0, generated: 0, edited: 0, shared: 0, archived: 0 },
  generations_last_30_days: 0,
  active_link_count: 0,
  expiring_link_count: 0,
  recent_proposals: [],
  active_links: [],
  recent_activity: [],
}
const populated: DashboardSummary = {
  ...empty,
  proposal_counts: { draft: 1, generated: 2, edited: 1, shared: 1, archived: 1 },
  generations_last_30_days: 3,
  active_link_count: 2,
  expiring_link_count: 1,
  recent_proposals: [
    {
      id: 'p-1',
      title: 'Site institucional',
      client_name: 'Padaria',
      role: 'owner',
      status: 'shared',
      updated_at: when,
    },
    {
      id: 'p-2',
      title: 'App de pedidos',
      client_name: 'Mercado',
      role: 'editor',
      status: 'edited',
      updated_at: when,
    },
    {
      id: 'p-3',
      title: 'Pesquisa',
      client_name: 'Estúdio',
      role: 'viewer',
      status: 'generated',
      updated_at: when,
    },
  ],
  active_links: [
    { id: 'l-1', proposal_id: 'p-1', proposal_title: 'Site institucional', expires_at: when },
  ],
  recent_activity: [
    {
      event_id: 'v-1',
      kind: 'edited',
      proposal_id: 'p-2',
      proposal_title: 'App de pedidos',
      occurred_at: when,
      version: 2,
    },
    {
      event_id: 'l-1',
      kind: 'link_created',
      proposal_id: 'p-1',
      proposal_title: 'Site institucional',
      occurred_at: when,
      version: null,
    },
  ],
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows loading and the first-proposal action for a new account', async () => {
    stubApi({ 'GET /dashboard/summary': () => jsonResponse(200, empty) })
    renderRoute(<HomePage />, { session: session() })

    expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Carregando painel' })).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar primeira proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova',
    )
    expect(screen.getByText('Nenhum link ativo em propostas que você possui.')).toBeInTheDocument()
    expect(screen.getByText('Versões e alterações em links aparecem aqui.')).toBeInTheDocument()
  })

  it('renders aggregate counts and role-aware links to proposals, links and activity', async () => {
    stubApi({ 'GET /dashboard/summary': () => jsonResponse(200, populated) })
    renderRoute(<HomePage />, { session: session() })

    const recent = within(await screen.findByRole('region', { name: 'Propostas recentes' }))
    expect(recent.getByRole('link', { name: /Site institucional/ })).toHaveTextContent(
      'Compartilhada',
    )
    expect(recent.getByRole('link', { name: /App de pedidos/ })).toHaveTextContent('Editor')
    expect(recent.getByRole('link', { name: /Pesquisa/ })).toHaveTextContent('Leitor')
    expect(recent.getByRole('link', { name: /Ver todas/ })).toHaveAttribute('href', '/propostas')
    expect(screen.getByText('Propostas', { selector: 'dt' }).parentElement).toHaveTextContent('6')
    expect(screen.getByRole('region', { name: 'Propostas por situação' })).toHaveTextContent(
      'Gerada2',
    )
    const sharing = within(screen.getByRole('region', { name: 'Links de compartilhamento' }))
    expect(sharing.getByRole('link', { name: /Site institucional/ })).toHaveAttribute(
      'href',
      '/propostas/p-1',
    )
    const activity = within(screen.getByRole('region', { name: 'Atividade recente' }))
    expect(activity.getByRole('link', { name: /Versão editada.*v2/ })).toHaveAttribute(
      'href',
      '/propostas/p-2',
    )
    expect(activity.getByText('Link criado')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Nenhuma proposta ainda' }),
    ).not.toBeInTheDocument()
  })

  it('shows request errors and reloads the dashboard', async () => {
    let calls = 0
    stubApi({
      'GET /dashboard/summary': () =>
        ++calls === 1
          ? jsonResponse(500, { code: 'internal_error', message: 'Erro interno. Tente novamente.' })
          : jsonResponse(200, empty),
    })
    renderRoute(<HomePage />, { session: session() })

    expect(await screen.findByText('Erro interno. Tente novamente.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma proposta ainda')).toBeInTheDocument()
  })

  it('allows signing out and changing the theme from the account menu', async () => {
    stubApi({ 'GET /dashboard/summary': () => jsonResponse(200, empty) })
    const current = session()
    renderRoute(<HomePage />, { session: current })

    await userEvent.click(screen.getByText('ana@example.com'))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Escuro' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('silver-proposals-theme')).toBe('dark')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: /ana@example.com/ }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))
    expect(current.logout).toHaveBeenCalledOnce()
  })
})
