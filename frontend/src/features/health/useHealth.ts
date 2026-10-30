import { useQuery } from '@tanstack/react-query'

export type Health = { status: string; version: string }

async function fetchHealth(): Promise<Health> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error('The server is not responding.')
  return (await response.json()) as Health
}

/** The server's health check. Its `version` is the commit the server was built from. */
export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth })
}
