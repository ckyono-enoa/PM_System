import {
  ClipboardList,
  FolderKanban,
  Inbox,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { label: string; to: string; icon: LucideIcon }

/** The main navigation, in order. Admin will show only to people allowed to see it. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'My Work', to: '/my-work', icon: ListChecks },
  { label: 'My Requests', to: '/my-requests', icon: ClipboardList },
  { label: 'Queues', to: '/queues', icon: Inbox },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Admin', to: '/admin', icon: Settings },
]
