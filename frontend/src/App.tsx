import { useEffect, useState } from 'react'

type Health = { status: string; version: string }

type HealthCheck =
  { state: 'checking' } | { state: 'ok'; health: Health } | { state: 'failed' }

export default function App() {
  const [check, setCheck] = useState<HealthCheck>({ state: 'checking' })

  useEffect(() => {
    let ignore = false
    fetch('/api/health')
      .then((response) => {
        if (!response.ok)
          throw new Error(`Health check returned ${response.status}`)
        return response.json() as Promise<Health>
      })
      .then((health) => {
        if (!ignore) setCheck({ state: 'ok', health })
      })
      .catch(() => {
        if (!ignore) setCheck({ state: 'failed' })
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <main>
      <h1>PM_System</h1>
      <p>E Noa&rsquo;s tickets, projects, and tasks. Coming soon.</p>
      <p role="status">
        {check.state === 'checking' && 'Checking the server…'}
        {check.state === 'ok' &&
          `Server is up. Version: ${check.health.version}`}
        {check.state === 'failed' && 'The server is not responding.'}
      </p>
    </main>
  )
}
