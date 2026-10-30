import { NavLink } from 'react-router'
import { ServerVersion } from '@/features/health/ServerVersion'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

/** The main navigation. Used in the left column on computers and in the menu on phones. */
export function MainNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <nav aria-label="Main">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    isActive && 'bg-accent text-accent-foreground',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto px-3">
        <ServerVersion />
      </div>
    </div>
  )
}
