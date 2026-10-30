import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { MainNav } from './MainNav'
import { NewMenu } from './NewMenu'
import { UserMenu } from './UserMenu'

/** The frame around every screen: top bar, navigation, and the page itself. */
export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Go to a section of PM_System.
              </SheetDescription>
            </SheetHeader>
            <MainNav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="min-w-0 truncate text-lg font-semibold">
          PM_System
        </span>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <NewMenu />
          <ThemeSwitcher />
          <UserMenu />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r md:block">
          <MainNav />
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
