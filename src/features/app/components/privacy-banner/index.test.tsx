import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { PrivacyBanner } from '@features/app/components/privacy-banner'

describe('PrivacyBanner', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('stays hidden when the current notice was accepted', () => {
    const session = fakeSession({ status: 'authenticated', user: fakeUser() })
    renderRoute(<PrivacyBanner />, { session })

    expect(screen.queryByRole('region', { name: 'Aviso de privacidade' })).not.toBeInTheDocument()
  })

  it('asks to accept a newer notice and updates the session', async () => {
    stubApi({ 'POST /account/privacy-acceptance': () => jsonResponse(200, fakeUser()) })
    const session = fakeSession({
      status: 'authenticated',
      user: fakeUser({ privacy_up_to_date: false }),
    })
    renderRoute(<PrivacyBanner />, { session })

    expect(screen.getByRole('link', { name: 'aviso de privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Li e aceito' }))

    await waitFor(() => expect(session.setUser).toHaveBeenCalled())
  })

  it('shows an error when accepting fails', async () => {
    stubApi({
      'POST /account/privacy-acceptance': () =>
        jsonResponse(503, { code: 'unavailable', message: 'Tente novamente.' }),
    })
    const session = fakeSession({
      status: 'authenticated',
      user: fakeUser({ privacy_up_to_date: false }),
    })
    renderRoute(<PrivacyBanner />, { session })

    await userEvent.click(screen.getByRole('button', { name: 'Li e aceito' }))

    expect(await screen.findByText('Tente novamente.')).toBeInTheDocument()
  })
})
