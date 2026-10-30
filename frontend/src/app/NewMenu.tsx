import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Placeholder for the always-visible "New" button. Creating items arrives with the ticket and project stories. */
export function NewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>New ticket (coming soon)</DropdownMenuItem>
        <DropdownMenuItem disabled>New project (coming soon)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
