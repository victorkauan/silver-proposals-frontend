type Handler = (init: RequestInit | undefined, url: URL) => Response | Promise<Response>

export function stubApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input))
    const key = `${init?.method ?? 'GET'} ${url.pathname}`
    const handler = routes[key]
    if (!handler) throw new Error(`Unexpected request: ${key}`)
    return handler(init, url)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
