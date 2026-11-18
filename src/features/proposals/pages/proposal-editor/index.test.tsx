import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { ProposalEditorPage } from '@features/proposals/pages/proposal-editor'
import type { ProposalDetail } from '@features/proposals/proposal.type'

const base: ProposalDetail = {
  id: 'p-1',
  title: 'Site institucional',
  client_name: 'Padaria Pão Quente',
  role: 'owner',
  archived_at: null,
  updated_at: '2026-11-18T12:00:00Z',
  briefing: 'Site com cardápio',
  content: '# Proposta\n\n## Investimento\n\nValor: [A DEFINIR]',
  version: 3,
  created_at: '2026-11-18T12:00:00Z',
}

function render(routes: Parameters<typeof stubApi>[0] = {}) {
  const fetchMock = stubApi({ 'GET /proposals/p-1': () => jsonResponse(200, base), ...routes })
  const view = renderRoute(<ProposalEditorPage />, {
    path: '/propostas/:id/editar',
    initialEntries: ['/propostas/p-1/editar'],
    extraRoutes: [{ path: '/propostas/:id', element: <p>detalhe</p> }],
  })
  return { ...view, fetchMock }
}

async function editor(): Promise<HTMLTextAreaElement> {
  return (await screen.findByLabelText('Conteúdo em Markdown')) as HTMLTextAreaElement
}

describe('ProposalEditorPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the Markdown next to a live preview and the saved state', async () => {
    render()

    const textarea = await editor()
    expect(textarea).toHaveValue(base.content)
    expect(screen.getByText(/Versão 3 salva/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()

    await userEvent.type(textarea, '\n\n## Prazo')

    const preview = screen.getByRole('region', { name: 'Visualização' })
    expect(preview).toHaveTextContent('Prazo')
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(screen.getByText('1 ponto a definir')).toBeInTheDocument()
  })

  it('saves with the loaded version and shows the new one', async () => {
    const saved = { ...base, content: `${base.content}!`, version: 4 }
    const { fetchMock } = render({ 'PUT /proposals/p-1/content': () => jsonResponse(200, saved) })

    await userEvent.type(await editor(), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Proposta salva')).toBeInTheDocument()
    expect(screen.getByText(/Versão 4 salva/)).toBeInTheDocument()
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ content: saved.content, base_version: 3 })
  })

  it('saves with Ctrl+S', async () => {
    const { fetchMock } = render({
      'PUT /proposals/p-1/content': () => jsonResponse(200, { ...base, content: 'x', version: 4 }),
    })

    const textarea = await editor()
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'x')
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true),
    )
  })

  it('shows the API error when saving fails', async () => {
    render({
      'PUT /proposals/p-1/content': () =>
        jsonResponse(422, { code: 'validation_error', message: 'Verifique os dados informados.' }),
    })

    await userEvent.type(await editor(), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Verifique os dados informados.')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível salvar', { selector: 'span' })).toBeInTheDocument()
  })

  it('explains a conflict and loads the latest version', async () => {
    let latest = false
    render({
      'GET /proposals/p-1': () =>
        jsonResponse(200, latest ? { ...base, content: 'Texto do colega', version: 5 } : base),
      'PUT /proposals/p-1/content': () => {
        latest = true
        return jsonResponse(409, {
          code: 'version_conflict',
          message: 'A proposta foi alterada por outra pessoa.',
        })
      },
    })
    const user = userEvent.setup()

    await user.type(await editor(), ' meu texto')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByRole('alertdialog', { name: 'A proposta foi alterada por outra pessoa' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Copiar meu texto' }))
    await expect(navigator.clipboard.readText()).resolves.toBe(`${base.content} meu texto`)
    await user.click(screen.getByRole('button', { name: 'Carregar versão mais recente' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Conteúdo em Markdown')).toHaveValue('Texto do colega'),
    )
    expect(screen.getByText(/Versão 5 salva/)).toBeInTheDocument()
  })

  it('formats the selection and jumps to the next placeholder', async () => {
    render()

    const textarea = await editor()
    textarea.setSelectionRange(2, 10)
    await userEvent.click(screen.getByRole('button', { name: 'Negrito' }))
    expect(textarea).toHaveValue(base.content.replace('Proposta', '**Proposta**'))

    await userEvent.click(screen.getByRole('button', { name: '1 ponto a definir' }))
    await waitFor(() =>
      expect(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)).toBe(
        '[A DEFINIR]',
      ),
    )
  })

  it('switches between editor, split, and preview', async () => {
    render()

    await editor()
    await userEvent.click(screen.getByRole('button', { name: 'Só a visualização' }))
    expect(screen.queryByLabelText('Conteúdo em Markdown')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Só o editor' }))
    expect(screen.queryByRole('region', { name: 'Visualização' })).not.toBeInTheDocument()
  })

  it('asks before leaving with unsaved changes, and discards on request', async () => {
    const { router } = render()

    await userEvent.type(await editor(), '!')
    await router.navigate('/propostas/p-1')

    expect(
      await screen.findByRole('alertdialog', { name: 'Descartar alterações?' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(router.state.location.pathname).toBe('/propostas/p-1/editar')

    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.getByLabelText('Conteúdo em Markdown')).toHaveValue(base.content)
  })

  it('sends viewers back to the read-only page', async () => {
    const { router } = render({
      'GET /proposals/p-1': () => jsonResponse(200, { ...base, role: 'viewer' }),
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/propostas/p-1'))
  })
})
