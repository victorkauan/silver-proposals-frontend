import { applyTheme, readStoredTheme, THEME_STORAGE_KEY } from '@shared/theme/theme.context'

describe('theme', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to system and ignores unknown values', () => {
    expect(readStoredTheme()).toBe('system')
    localStorage.setItem(THEME_STORAGE_KEY, 'neon')
    expect(readStoredTheme()).toBe('system')
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it('toggles the dark class', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveClass('dark')
    applyTheme('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
