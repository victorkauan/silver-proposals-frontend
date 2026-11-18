import { type ReactNode, useEffect, useMemo, useState } from 'react'

import {
  applyTheme,
  readStoredTheme,
  type Theme,
  THEME_STORAGE_KEY,
  ThemeContext,
} from '@shared/theme/theme.context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
