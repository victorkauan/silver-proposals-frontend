import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { request, setAccessToken } from '@shared/api/http.client'
import { fakeUser } from '@shared/test/render.helper'
import { authApi } from '@features/auth/auth.api'
import { SessionProvider } from '@features/auth/components/session-provider'
import { useSession } from '@features/auth/session.context'

vi.mock('@features/auth/auth.api', () => ({
  authApi: { refresh: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))

const api = vi.mocked(authApi)
const tokens = (token: string) => ({
  access_token: token,
  token_type: 'bearer' as const,
  expires_in: 900,
  user: fakeUser({ id: '1', email: 'ana@example.com', name: 'Ana' }),
})

function Probe() {
  const session = useSession()
  return (
    <div>
      <p>status: {session.status}</p>
      <p>user: {session.user?.name ?? '-'}</p>
      <p>notice: {session.notice ?? '-'}</p>
      <button onClick={() => session.setUser(fakeUser({ name: 'Ana Souza' }))}>rename</button>
      <button onClick={() => session.endSession('account_deleted')}>end</button>
      <button
        onClick={() => void session.login({ email: 'ana@example.com', password: 'senha longa' })}
      >
        login
      </button>
      <button onClick={() => void session.logout()}>logout</button>
    </div>
  )
}

function renderProvider() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider>
        <Probe />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe('SessionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAccessToken(null)
  })

  it('restores the session from the refresh cookie on load', async () => {
    api.refresh.mockResolvedValue(tokens('t1'))

    renderProvider()

    expect(await screen.findByText('status: authenticated')).toBeInTheDocument()
    expect(screen.getByText('user: Ana')).toBeInTheDocument()
  })

  it('becomes anonymous when there is no valid session', async () => {
    api.refresh.mockRejectedValue(new Error('401'))

    renderProvider()

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
  })

  it('logs in and out', async () => {
    api.refresh.mockRejectedValue(new Error('401'))
    api.login.mockResolvedValue(tokens('t2'))
    api.logout.mockResolvedValue(undefined)
    renderProvider()
    await screen.findByText('status: anonymous')

    await userEvent.click(screen.getByRole('button', { name: 'login' }))
    await screen.findByText('status: authenticated')
    await userEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(api.logout).toHaveBeenCalledOnce()
  })

  it('shares one refresh between concurrent 401 responses', async () => {
    let release: (value: ReturnType<typeof tokens>) => void = () => {}
    api.refresh.mockReturnValueOnce(new Promise((resolve) => (release = resolve)))
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)
    renderProvider()

    const calls = [request('/a').catch(() => null), request('/b').catch(() => null)]
    await act(async () => release(tokens('t3')))
    await Promise.all(calls)

    await waitFor(() => expect(api.refresh).toHaveBeenCalledOnce())
    vi.unstubAllGlobals()
  })

  it('updates the user and ends the session with a notice that the next login clears', async () => {
    api.refresh.mockResolvedValue(tokens('t1'))
    api.login.mockResolvedValue(tokens('t2'))
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('status: authenticated')

    await user.click(screen.getByRole('button', { name: 'rename' }))
    expect(screen.getByText('user: Ana Souza')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'end' }))
    expect(screen.getByText('status: anonymous')).toBeInTheDocument()
    expect(screen.getByText('notice: account_deleted')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(screen.getByText('notice: -')).toBeInTheDocument())
  })
})
