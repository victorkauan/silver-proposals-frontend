import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, renderRoute, fakeUser } from '@shared/test/render.helper'
import { jsonResponse, sseEvent, sseResponse } from '@shared/test/sse.helper'
import { ProposalPage } from '@features/proposals/pages/proposal'
import type { ProposalDetail } from '@features/proposals/proposal.type'

const base: ProposalDetail = {
  id: 'p-1',
  title: 'Site institucional',
  client_name: 'Padaria Pão Quente',
  role: 'owner',
  status: 'edited',
  archived_at: null,
  updated_at: '2026-11-17T12:00:00Z',
  briefing: 'Site com cardápio',
  content:
    '# Proposta comercial\n\n## Escopo\n\n- Cardápio online\n\n## Investimento\n\nValor: [A DEFINIR]. Prazo: [A DEFINIR].\n\n<script>alert(1)</script>',
  version: 2,
  created_at: '2026-11-17T12:00:00Z',
}

function render(proposal: Partial<ProposalDetail> | (() => Response)) {
  stubApi({
    'GET /proposals/p-1':
      typeof proposal === 'function' ? proposal : () => jsonResponse(200, { ...base, ...proposal }),
  })
  return renderRoute(<ProposalPage />, {
    session: fakeSession({
      status: 'authenticated',
      user: fakeUser({ id: '1', email: 'ana@example.com', name: 'Ana Lima' }),
    }),
    path: '/propostas/:id',
    initialEntries: ['/propostas/p-1'],
  })
}

describe('ProposalPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders the Markdown content without raw HTML', async () => {
    render({})

    expect(await screen.findByRole('heading', { name: 'Site institucional' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escopo' })).toBeInTheDocument()
    expect(screen.getByText('Cardápio online').tagName).toBe('LI')
    expect(screen.getByText('Versão 2')).toBeInTheDocument()
    expect(document.querySelector('article script')).toBeNull()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/propostas/p-1/editar',
    )
    expect(screen.getByRole('link', { name: 'Histórico' })).toHaveAttribute(
      'href',
      '/propostas/p-1/historico',
    )
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument()
  })

  it.each([
    ['edited', 'Editada'],
    ['shared', 'Compartilhada'],
    ['archived', 'Arquivada'],
  ] as const)('shows the real status %s instead of a fixed draft badge', async (status, label) => {
    render({ status })

    expect(await screen.findByText(label)).toBeInTheDocument()
    expect(screen.queryByText('Rascunho')).not.toBeInTheDocument()
  })

  it('shows the outline, links to sections, and highlights the gaps the AI left', async () => {
    render({})

    const outline = within(await screen.findByRole('navigation', { name: 'Sumário' }))
    expect(outline.getByRole('link', { name: /Escopo/ })).toHaveAttribute('href', '#secao-1')
    expect(outline.getByRole('link', { name: /Investimento/ })).toHaveAttribute('href', '#secao-2')
    expect(screen.getByRole('heading', { name: 'Investimento' })).toHaveAttribute('id', 'secao-2')
    expect(screen.getByText('2 pontos a definir')).toBeInTheDocument()
    expect(document.querySelectorAll('mark[data-placeholder]')).toHaveLength(2)
  })

  it('stops a running generation and keeps the saved content', async () => {
    stubApi({
      'GET /proposals/p-1': () => jsonResponse(200, base),
      'POST /proposals/p-1/generate': (init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(sseEvent('delta', { text: '## Novo\n' })))
              init?.signal?.addEventListener('abort', () =>
                controller.error(new DOMException('aborted', 'AbortError')),
              )
            },
          }),
        ),
    })
    renderRoute(<ProposalPage />, { path: '/propostas/:id', initialEntries: ['/propostas/p-1'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Gerar novamente' }))
    expect(await screen.findByRole('list', { name: 'Seções escritas' })).toHaveTextContent('Novo')
    await userEvent.click(screen.getByRole('button', { name: 'Parar geração' }))

    expect(await screen.findByRole('heading', { name: 'Escopo' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Proposta sendo gerada' })).not.toBeInTheDocument()
  })

  it('generates the first version from an empty proposal', async () => {
    let generated = false
    const fetchMock = stubApi({
      'GET /proposals/p-1': () =>
        jsonResponse(200, generated ? base : { ...base, content: '', version: 0 }),
      'POST /proposals/p-1/generate': () => {
        generated = true
        return sseResponse([
          sseEvent('delta', { text: '# Proposta comercial\n' }),
          sseEvent('done', { proposal_id: 'p-1', version: 2 }),
        ])
      },
    })
    renderRoute(<ProposalPage />, { path: '/propostas/:id', initialEntries: ['/propostas/p-1'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Gerar com IA' }))

    expect(await screen.findByText('Versão 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escopo' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('shows the generation error and keeps the saved content', async () => {
    stubApi({
      'GET /proposals/p-1': () => jsonResponse(200, base),
      'POST /proposals/p-1/generate': () =>
        sseResponse([
          sseEvent('error', {
            code: 'generation_failed',
            message: 'Não foi possível gerar a proposta. Tente novamente.',
          }),
        ]),
    })
    renderRoute(<ProposalPage />, { path: '/propostas/:id', initialEntries: ['/propostas/p-1'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Gerar novamente' }))

    expect(
      await screen.findByText('Não foi possível gerar a proposta. Tente novamente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escopo' })).toBeInTheDocument()
  })

  it('is read-only for viewers', async () => {
    render({ role: 'viewer', content: '' })

    expect(
      await screen.findByText('O conteúdo aparecerá aqui quando for escrito.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Histórico' })).toBeInTheDocument()
    for (const name of ['Gerar com IA', 'Compartilhar', 'Mais ações']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(
      screen.queryByRole('link', { name: /Editar|Escrever manualmente/ }),
    ).not.toBeInTheDocument()
  })

  it('lets editors edit but not share', async () => {
    render({ role: 'editor' })

    expect(await screen.findByRole('link', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument()
  })

  it('says when the proposal does not exist', async () => {
    render(() =>
      jsonResponse(404, { code: 'proposal_not_found', message: 'Proposta não encontrada.' }),
    )

    expect(await screen.findByText('Proposta não encontrada.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às propostas' })).toHaveAttribute(
      'href',
      '/propostas',
    )
  })

  it('shows other errors with a retry', async () => {
    let calls = 0
    render(() =>
      ++calls === 1
        ? jsonResponse(500, { code: 'internal_error', message: 'Erro interno.' })
        : jsonResponse(200, base),
    )

    expect(await screen.findByText('Erro interno.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { name: 'Site institucional' })).toBeInTheDocument()
  })
})
