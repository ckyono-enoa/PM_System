/** Light, dark, and "match system" themes. The choice is remembered in this browser. */

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system']

const STORAGE_KEY = 'pm-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

/** The saved choice, or "system" if nothing valid is saved or storage is blocked. */
export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function storeTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Storage is blocked (for example in a private window). The choice still
    // applies until the page is closed.
  }
}

/** The media query that tells us whether the computer or phone is set to dark. */
export function systemDarkQuery(): MediaQueryList {
  return window.matchMedia(DARK_QUERY)
}

/** Put the theme on the page: the `dark` class on <html> turns on the dark tokens. */
export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === 'dark' ||
    (preference === 'system' && systemDarkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}
