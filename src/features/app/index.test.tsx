import { render, screen } from '@testing-library/react'

import { App } from '@features/app'

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the login page when there is no session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })),
    )

    render(<App />)

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })
})
