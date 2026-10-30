import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, stubHealth } from '@/test/renderApp'
import { setSystemDark } from '@/test/systemTheme'

const isDark = () => document.documentElement.classList.contains('dark')

async function chooseTheme(
  user: ReturnType<typeof renderApp>['user'],
  name: string,
) {
  await user.click(screen.getByRole('button', { name: 'Theme' }))
  await user.click(await screen.findByRole('menuitemradio', { name }))
}

describe('theme switcher', () => {
  it('offers Light, Dark, and Match system, starting on Match system', async () => {
    stubHealth()
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Theme' }))

    expect(
      await screen.findByRole('menuitemradio', { name: 'Match system' }),
    ).toBeChecked()
    expect(
      screen.getByRole('menuitemradio', { name: 'Light' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('menuitemradio', { name: 'Dark' }),
    ).not.toBeChecked()
  })

  it('switches to dark and back to light', async () => {
    stubHealth()
    const { user } = renderApp()

    await chooseTheme(user, 'Dark')
    expect(isDark()).toBe(true)

    await chooseTheme(user, 'Light')
    expect(isDark()).toBe(false)
  })

  it('remembers the choice in the browser', async () => {
    stubHealth()
    const { user } = renderApp()

    await chooseTheme(user, 'Dark')

    expect(localStorage.getItem('pm-theme')).toBe('dark')
  })

  it('starts with the remembered choice', async () => {
    localStorage.setItem('pm-theme', 'dark')
    stubHealth()
    const { user } = renderApp()

    expect(isDark()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Theme' }))
    expect(
      await screen.findByRole('menuitemradio', { name: 'Dark' }),
    ).toBeChecked()
  })

  it('ignores a remembered value it does not recognise', () => {
    localStorage.setItem('pm-theme', 'purple')
    stubHealth()
    renderApp()

    expect(isDark()).toBe(false)
  })

  it('follows the device setting on Match system, including when it changes', async () => {
    setSystemDark(true)
    stubHealth()
    renderApp()
    expect(isDark()).toBe(true)

    act(() => setSystemDark(false))
    expect(isDark()).toBe(false)
  })

  it('ignores the device setting once Light or Dark is chosen', async () => {
    stubHealth()
    const { user } = renderApp()
    await chooseTheme(user, 'Light')

    act(() => setSystemDark(true))

    expect(isDark()).toBe(false)
  })
})
