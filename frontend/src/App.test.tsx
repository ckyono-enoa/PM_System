import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the server version from the health check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(Response.json({ status: 'ok', version: 'abc1234' })),
      ),
    )

    render(<App />)

    expect(
      await screen.findByText('Server is up. Version: abc1234'),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/health')
  })

  it('says so when the server does not answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 502 }))),
    )

    render(<App />)

    expect(
      await screen.findByText('The server is not responding.'),
    ).toBeInTheDocument()
  })
})
