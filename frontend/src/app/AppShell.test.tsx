import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp, stubHealth } from '@/test/renderApp'

describe('app shell', () => {
  it('sends the home address to My Work', async () => {
    stubHealth()
    const { router } = renderApp('/')

    expect(
      await screen.findByRole('heading', { name: 'My Work' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/my-work')
  })

  it('shows the app name, the New button, and the user menu in the top bar', async () => {
    stubHealth()
    renderApp()

    const header = screen.getByRole('banner')
    expect(within(header).getByText('PM_System')).toBeInTheDocument()
    expect(
      within(header).getByRole('button', { name: 'New' }),
    ).toBeInTheDocument()
    expect(
      within(header).getByRole('button', { name: 'User menu' }),
    ).toBeInTheDocument()
  })

  it.each([
    ['My Work', '/my-work'],
    ['My Requests', '/my-requests'],
    ['Queues', '/queues'],
    ['Projects', '/projects'],
    ['Admin', '/admin'],
  ])('has a %s page in the navigation', async (name, path) => {
    stubHealth()
    const { router, user } = renderApp('/my-work')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name }))

    expect(router.state.location.pathname).toBe(path)
    expect(
      await screen.findByRole('heading', { name, level: 1 }),
    ).toBeInTheDocument()
  })

  it('marks the current page in the navigation', () => {
    stubHealth()
    renderApp('/projects')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      within(nav).getByRole('link', { name: 'My Work' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('says so when the address does not exist, and keeps the navigation', () => {
    stubHealth()
    renderApp('/nowhere')

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('opens the menu on a phone, and closes it after choosing a page', async () => {
    stubHealth()
    const { router, user } = renderApp('/my-work')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    await user.click(within(dialog).getByRole('link', { name: 'Queues' }))

    expect(router.state.location.pathname).toBe('/queues')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the server version from the health check', async () => {
    stubHealth('abc1234')
    renderApp()

    expect(await screen.findByText('Version: abc1234')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/health')
  })

  it('says so when the server does not answer, and can try again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 502 }))),
    )
    const { user } = renderApp()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The server is not responding.')

    stubHealth('def5678')
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Version: def5678')).toBeInTheDocument()
  })
})
