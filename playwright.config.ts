import { defineConfig, devices } from '@playwright/test'

// The API only allows CORS from http://localhost:5173, and its refresh cookie is SameSite=Strict,
// so the app under test must be served from that same origin.
const port = 5173
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:8000'

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    locale: 'pt-BR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    env: { VITE_API_BASE_URL: apiUrl },
    // Always test the production build: a dev server would hide production-only bugs.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
