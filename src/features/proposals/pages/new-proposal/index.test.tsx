import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, renderRoute } from '@shared/test/render.helper'
import { jsonResponse, sseEvent, sseResponse } from '@shared/test/sse.helper'
import { NewProposalPage } from '@features/proposals/pages/new-proposal'

const session = () =>
  fakeSession({
    status: 'authenticated',
    user: { id: '1', email: 'ana@example.com', name: 'Ana Lima' },
  })

const created = () =>
  jsonResponse(201, {
    id: 'p-1',
    title: 'Site institucional',
    client_name: 'Padaria',
    role: 'owner',
    archived_at: null,
    updated_at: '2026-11-17T12:00:00Z',
    briefing: 'Site com cardápio',
    content: '',
    version: 0,
    created_at: '2026-11-17T12:00:00Z',
  })

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Título'), 'Site institucional')
  await userEvent.type(screen.getByLabelText('Cliente'), 'Padaria')
  await userEvent.type(screen.getByLabelText('Briefing'), 'Site com cardápio')
  await userEvent.click(screen.getByRole('button', { name: 'Gerar proposta' }))
}

function render() {
  return renderRoute(<NewProposalPage />, {
    session: session(),
    path: '/propostas/nova',
    extraRoutes: [{ path: '/propostas/:id', element: <p>detalhe</p> }],
  })
}

describe('NewProposalPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('validates the form in pt-BR', async () => {
    render()

    await userEvent.click(screen.getByRole('button', { name: 'Gerar proposta' }))

    expect(await screen.findByText('Informe o título.')).toBeInTheDocument()
    expect(screen.getByText('Informe o cliente.')).toBeInTheDocument()
    expect(screen.getByText('Descreva o briefing para a IA gerar a proposta.')).toBeInTheDocument()
  })

  it('creates the proposal, streams the text, and opens it when done', async () => {
    let finish: () => void = () => {}
    const gate = new Promise<void>((resolve) => (finish = resolve))
    const fetchMock = stubApi({
      'POST /proposals': created,
      'POST /proposals/p-1/generate': () =>
        new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder()
              controller.enqueue(
                encoder.encode(sseEvent('delta', { text: '# Proposta comercial\n' })),
              )
              await gate
              controller.enqueue(
                encoder.encode(sseEvent('done', { proposal_id: 'p-1', version: 1 })),
              )
              controller.close()
            },
          }),
        ),
    })
    const { router } = render()

    await fillAndSubmit()

    expect(await screen.findByRole('heading', { name: 'Proposta comercial' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Proposta sendo gerada' })).toBeInTheDocument()
    finish()
    await waitFor(() => expect(router.state.location.pathname).toBe('/propostas/p-1'))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      title: 'Site institucional',
      client_name: 'Padaria',
      briefing: 'Site com cardápio',
    })
  })

  it('shows the AI error and retries without creating the proposal again', async () => {
    let attempt = 0
    const fetchMock = stubApi({
      'POST /proposals': created,
      'POST /proposals/p-1/generate': () =>
        ++attempt === 1
          ? sseResponse([
              sseEvent('error', {
                code: 'generation_unavailable',
                message: 'O serviço de IA está ocupado. Tente novamente em instantes.',
              }),
            ])
          : sseResponse([sseEvent('done', { proposal_id: 'p-1', version: 1 })]),
    })
    const { router } = render()

    await fillAndSubmit()

    expect(
      await screen.findByText('O serviço de IA está ocupado. Tente novamente em instantes.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir proposta' })).toHaveAttribute(
      'href',
      '/propostas/p-1',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/propostas/p-1'))
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/proposals'))).toHaveLength(
      1,
    )
  })

  it('shows the API error when creating fails', async () => {
    stubApi({
      'POST /proposals': () =>
        jsonResponse(429, { code: 'rate_limited', message: 'Muitas tentativas. Aguarde.' }),
    })
    render()

    await fillAndSubmit()

    expect(await screen.findByText('Muitas tentativas. Aguarde.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar proposta' })).toBeEnabled()
  })
})
