import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'silver-proposals-theme'

export type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeState | null>(null)

export function useTheme(): ThemeState {
  const state = useContext(ThemeContext)
  if (!state) throw new Error('useTheme must be used inside ThemeProvider')
  return state
}

export function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}
