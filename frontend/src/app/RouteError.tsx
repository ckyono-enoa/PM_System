import { Link, useRouteError } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'

/** Shown inside the shell when a screen crashes, so the navigation still works. */
export function RouteError() {
  const error = useRouteError()
  return (
    <div className="max-w-2xl space-y-3">
      <ErrorNotice error={error} title="This page could not be shown" />
      <Link to="/my-work" className="text-sm underline">
        Go to My Work
      </Link>
    </div>
  )
}
