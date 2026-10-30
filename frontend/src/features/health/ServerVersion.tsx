import { ErrorNotice } from '@/components/ErrorNotice'
import { useHealth } from './useHealth'

/** Shows which version of the server is running, or says it is not responding. */
export function ServerVersion() {
  const { data, error, isPending, refetch } = useHealth()

  if (error) {
    return (
      <ErrorNotice
        error={error}
        title="Server problem"
        onRetry={() => void refetch()}
      />
    )
  }
  return (
    <p role="status" className="text-muted-foreground text-xs">
      {isPending ? 'Checking the server…' : `Version: ${data.version}`}
    </p>
  )
}
