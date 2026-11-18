import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { fakeSession, renderRoute } from '@shared/test/render.helper'
import { HomePage } from '@features/app/pages/home'

const user = { id: '1', email: 'ana@example.com', name: 'Ana Lima' }

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('greets the user and shows the empty state inside the app shell', () => {
    renderRoute(<HomePage />, { session: fakeSession({ status: 'authenticated', user }) })

    expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
    expect(screen.getByText('Nenhuma proposta ainda')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Primeiros passos' })).toBeInTheDocument()
    const steps = within(screen.getByRole('region', { name: 'Primeiros passos' }))
    expect(
      steps.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Escreva o briefing', 'Gere com IA', 'Edite e compartilhe'])
    expect(screen.getAllByText('Propostas').length).toBeGreaterThan(0)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('logs out from the user menu', async () => {
    const session = fakeSession({ status: 'authenticated', user })
    renderRoute(<HomePage />, { session })

    await userEvent.click(screen.getByText('ana@example.com'))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(session.logout).toHaveBeenCalledOnce()
  })

  it('switches to the dark theme and remembers it', async () => {
    renderRoute(<HomePage />, { session: fakeSession({ status: 'authenticated', user }) })

    await userEvent.click(screen.getByText('ana@example.com'))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Escuro' }))

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('silver-proposals-theme')).toBe('dark')
  })
})
