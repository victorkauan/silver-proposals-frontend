import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { AppShell } from '@features/app/components/app-shell'

function renderAt(path: string) {
  const session = fakeSession({ status: 'authenticated', user: fakeUser() })
  return renderRoute(
    <AppShell page="Teste">
      <p>conteúdo</p>
    </AppShell>,
    { session, path, initialEntries: [path] },
  )
}

describe('AppSidebar', () => {
  it('lists only product areas and keeps the account in the user menu', async () => {
    renderAt('/')

    const nav = screen.getByText('Plataforma').closest('[data-slot="sidebar-group"]')
    expect(nav).not.toBeNull()
    expect(
      within(nav as HTMLElement)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Propostas'])

    await userEvent.click(screen.getByRole('button', { name: /ana@example.com/ }))
    expect(await screen.findByRole('menuitem', { name: 'Minha conta' })).toHaveAttribute(
      'href',
      '/conta',
    )
  })

  it('highlights the user menu while on the account pages', () => {
    renderAt('/conta/perfil')

    expect(screen.getByRole('button', { name: /ana@example.com/ })).toHaveAttribute('data-active')
    expect(screen.getByRole('link', { name: 'Propostas' })).not.toHaveAttribute('data-active')
  })
})
