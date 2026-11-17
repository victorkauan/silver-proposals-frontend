describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reads the API base URL from the environment', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')

    const { config } = await import('@shared/config/env.config')

    expect(config.apiBaseUrl).toBe('https://api.example.com')
  })

  it('fails fast when the API base URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    await expect(import('@shared/config/env.config')).rejects.toThrow('VITE_API_BASE_URL')
  })
})
