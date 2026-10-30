import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { installMatchMedia, resetMatchMedia } from './systemTheme'

beforeEach(installMatchMedia)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  resetMatchMedia()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})
