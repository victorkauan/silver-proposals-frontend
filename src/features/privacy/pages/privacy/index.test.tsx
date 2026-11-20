import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { PRIVACY_CONTACT, PRIVACY_SECTIONS } from '@features/privacy/privacy.content'
import { PrivacyPage } from '@features/privacy/pages/privacy'

describe('PrivacyPage', () => {
  it('shows every section, the contact, and returns to sign-up for visitors', () => {
    renderRoute(<PrivacyPage />, { path: '/privacidade' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Aviso de privacidade' }),
    ).toBeInTheDocument()
    for (const section of PRIVACY_SECTIONS) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: PRIVACY_CONTACT })).toHaveAttribute(
      'href',
      `mailto:${PRIVACY_CONTACT}`,
    )
  })

  it('closes the tab when opened from sign-up, falling back to sign-up', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1)
    const close = vi.spyOn(window, 'close').mockImplementation(() => {})
    const { router } = renderRoute(<PrivacyPage />, {
      path: '/privacidade',
      extraRoutes: [{ path: '/cadastro', element: <p>cadastro</p> }],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(close).toHaveBeenCalled()
    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'))
    vi.restoreAllMocks()
  })

  it('falls back to the account data page for signed-in users in a new tab', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1)
    vi.spyOn(window, 'close').mockImplementation(() => {})
    const session = fakeSession({ status: 'authenticated', user: fakeUser() })
    const { router } = renderRoute(<PrivacyPage />, {
      session,
      path: '/privacidade',
      extraRoutes: [{ path: '/conta/dados', element: <p>dados</p> }],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/dados'))
    vi.restoreAllMocks()
  })

  it('goes back in history when reached inside the app', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(3)
    const { router } = renderRoute(<PrivacyPage />, {
      path: '/privacidade',
      initialEntries: ['/conta/dados', '/privacidade'],
      extraRoutes: [{ path: '/conta/dados', element: <p>dados</p> }],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/conta/dados'))
    vi.restoreAllMocks()
  })
})
