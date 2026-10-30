import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

type Props = {
  error: unknown
  /** Shown above the message. */
  title?: string
  /** If given, a Try again button calls it. */
  onRetry?: () => void
  className?: string
}

/** The one way errors are shown, for example when a query fails. */
export function ErrorNotice({
  error,
  title = 'Something went wrong',
  onRetry,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'border-destructive/50 flex items-start gap-3 rounded-lg border p-3 text-sm',
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="text-destructive mt-0.5 size-4 shrink-0"
      />
      <div className="min-w-0 space-y-2">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground break-words">
          {getErrorMessage(error)}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
