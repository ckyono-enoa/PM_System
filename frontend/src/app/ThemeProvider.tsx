import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  systemDarkQuery,
  type ThemePreference,
} from './theme'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredTheme)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return
    // "Match system" follows the device if its setting changes while the app is open.
    const query = systemDarkQuery()
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [preference])

  const value = useMemo(
    () => ({
      preference,
      setPreference: (next: ThemePreference) => {
        storeTheme(next)
        setPreferenceState(next)
      },
    }),
    [preference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
