import { setAccessToken } from '@shared/api/http.client'
import { jsonResponse, sseEvent, sseResponse } from '@shared/test/sse.helper'
import {
  GENERATION_FAILED_MESSAGE,
  type GenerationEvent,
  streamGeneration,
} from '@features/proposals/generation.api'

async function collect(): Promise<GenerationEvent[]> {
  const events: GenerationEvent[] = []
  for await (const event of streamGeneration('p-1', new AbortController().signal))
    events.push(event)
  return events
}

describe('streamGeneration', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken('token-1')
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it('posts to the generate endpoint and yields deltas until done', async () => {
    fetchMock.mockResolvedValue(
      sseResponse([
        sseEvent('delta', { text: '# Proposta' }),
        'event: delta\ndata: not json\n\n',
        sseEvent('ping', {}),
        sseEvent('done', { proposal_id: 'p-1', version: 2 }),
        sseEvent('delta', { text: 'ignored after done' }),
      ]),
    )

    await expect(collect()).resolves.toEqual([
      { type: 'delta', text: '# Proposta' },
      { type: 'done', version: 2 },
    ])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/proposals\/p-1\/generate$/)
    expect(init?.method).toBe('POST')
  })

  it('passes the API error event through', async () => {
    fetchMock.mockResolvedValue(
      sseResponse([
        sseEvent('error', { code: 'generation_timeout', message: 'A geração demorou demais.' }),
      ]),
    )

    await expect(collect()).resolves.toEqual([
      { type: 'error', code: 'generation_timeout', message: 'A geração demorou demais.' },
    ])
  })

  it('uses a generic message for a malformed error event', async () => {
    fetchMock.mockResolvedValue(sseResponse([sseEvent('error', {})]))

    await expect(collect()).resolves.toEqual([
      { type: 'error', code: 'generation_failed', message: GENERATION_FAILED_MESSAGE },
    ])
  })

  it('reports a stream that ends without done', async () => {
    fetchMock.mockResolvedValue(sseResponse([sseEvent('delta', { text: 'a' })]))

    await expect(collect()).resolves.toEqual([
      { type: 'delta', text: 'a' },
      { type: 'error', code: 'stream_interrupted', message: GENERATION_FAILED_MESSAGE },
    ])
  })

  it('reports a response without a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    await expect(collect()).resolves.toEqual([
      { type: 'error', code: 'stream_interrupted', message: GENERATION_FAILED_MESSAGE },
    ])
  })

  it('throws the API error before the stream starts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        code: 'briefing_required',
        message: 'Preencha o briefing antes de gerar a proposta.',
      }),
    )

    await expect(collect()).rejects.toMatchObject({ code: 'briefing_required' })
  })
})
