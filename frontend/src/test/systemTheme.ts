import { vi } from 'vitest'

/** Whether the pretend device is set to dark. Tests change it with `setSystemDark`. */
let systemDark = false
const listeners = new Set<() => void>()

export function setSystemDark(dark: boolean) {
  systemDark = dark
  listeners.forEach((listener) => listener())
}

/** jsdom has no matchMedia, so provide one that answers for "prefers-color-scheme: dark". */
export function installMatchMedia() {
  systemDark = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return systemDark
    },
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  }))
}

export function resetMatchMedia() {
  listeners.clear()
}
