import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApiError } from '@shared/api/http.client'
import { streamGeneration } from '@features/proposals/generation.api'
import { GENERATION_TIMEOUT_MESSAGE, useGeneration } from '@features/proposals/use-generation.hook'

vi.mock('@features/proposals/generation.api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  streamGeneration: vi.fn(),
}))

const stream = vi.mocked(streamGeneration)

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason as Error)
    signal.addEventListener('abort', () => reject(signal.reason as Error))
  })
}

describe('useGeneration', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports a timeout when the stream takes too long', async () => {
    const timeout = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
    stream.mockImplementation(async function* (_id, signal) {
      yield { type: 'delta', text: 'a' }
      await waitForAbort(signal)
    })
    const { result } = renderHook(useGeneration, { wrapper })

    let finished: Promise<boolean> = Promise.resolve(true)
    act(() => {
      finished = result.current.generate('p-1')
    })
    await act(async () => timeout.abort(new DOMException('timed out', 'TimeoutError')))

    await expect(finished).resolves.toBe(false)
    expect(result.current).toMatchObject({ status: 'error', error: GENERATION_TIMEOUT_MESSAGE })
  })

  it('shows API errors raised before the stream starts', async () => {
    stream.mockImplementation(async function* () {
      yield* []
      throw new ApiError(422, 'briefing_required', 'Preencha o briefing antes de gerar a proposta.')
    })
    const { result } = renderHook(useGeneration, { wrapper })

    await act(() => result.current.generate('p-1'))

    expect(result.current.error).toBe('Preencha o briefing antes de gerar a proposta.')
  })

  it('stays quiet when reset aborts a running generation', async () => {
    stream.mockImplementation(async function* (_id, signal) {
      yield* []
      await waitForAbort(signal)
    })
    const { result } = renderHook(useGeneration, { wrapper })

    let finished: Promise<boolean> = Promise.resolve(true)
    act(() => {
      finished = result.current.generate('p-1')
    })
    await act(async () => result.current.reset())

    await expect(finished).resolves.toBe(false)
    expect(result.current).toMatchObject({ status: 'idle', error: null })
  })
})
