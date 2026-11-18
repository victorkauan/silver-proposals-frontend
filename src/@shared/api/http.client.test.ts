import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  request,
  requestJson,
  setAccessToken,
  setRefreshHandler,
  UNEXPECTED_ERROR_MESSAGE,
} from '@shared/api/http.client'

function headersOf(call: Parameters<typeof fetch>): Record<string, string> {
  return (call[1]?.headers ?? {}) as Record<string, string>
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('http client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken(null)
    setRefreshHandler(null)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('sends the access token and JSON body, and includes credentials', async () => {
    setAccessToken('token-1')
    fetchMock.mockResolvedValue(json(200, { ok: true }))

    const result = await requestJson<{ ok: boolean }>('/x', { method: 'POST', body: { a: 1 } })

    expect(result).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/x$/)
    expect(init?.credentials).toBe('include')
    expect(init?.body).toBe('{"a":1}')
    expect(headersOf(fetchMock.mock.calls[0]).Authorization).toBe('Bearer token-1')
  })

  it('does not send the token when auth is disabled', async () => {
    setAccessToken('token-1')
    fetchMock.mockResolvedValue(json(200, {}))

    await request('/auth/login', { auth: false })

    expect(headersOf(fetchMock.mock.calls[0]).Authorization).toBeUndefined()
  })

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(requestJson('/x')).resolves.toBeUndefined()
  })

  it('turns API errors into ApiError with the pt-BR message', async () => {
    fetchMock.mockResolvedValue(
      json(422, {
        code: 'validation_error',
        message: 'Verifique os dados informados.',
        details: [{ field: 'email', type: 'value_error' }],
      }),
    )

    const error = await request('/x').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'validation_error',
      message: 'Verifique os dados informados.',
      details: [{ field: 'email', type: 'value_error' }],
    })
  })

  it('uses a generic message when the error body is not from the API', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))

    await expect(request('/x')).rejects.toMatchObject({
      code: 'unexpected_error',
      message: UNEXPECTED_ERROR_MESSAGE,
    })
  })

  it('uses a generic message when the error JSON has no code', async () => {
    fetchMock.mockResolvedValue(json(500, { detail: 'boom' }))

    await expect(request('/x')).rejects.toMatchObject({ message: UNEXPECTED_ERROR_MESSAGE })
  })

  it('reports network failures in pt-BR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/x')).rejects.toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE })
  })

  it('rethrows aborts untouched', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))

    await expect(request('/x')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    setAccessToken('expired')
    setRefreshHandler(async () => 'fresh')
    fetchMock.mockResolvedValueOnce(json(401, { code: 'invalid_token', message: 'x' }))
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))

    await expect(requestJson('/x')).resolves.toEqual({ ok: true })
    expect(headersOf(fetchMock.mock.calls[1]).Authorization).toBe('Bearer fresh')
  })

  it('gives up when the refresh fails', async () => {
    setRefreshHandler(async () => null)
    fetchMock.mockResolvedValue(
      json(401, { code: 'not_authenticated', message: 'Faça login para continuar.' }),
    )

    await expect(request('/x')).rejects.toMatchObject({ code: 'not_authenticated' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
