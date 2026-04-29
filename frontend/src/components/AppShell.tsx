import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell-sidebar-panel">
        <AppSidebar />
      </div>

      <main className="app-shell-main-panel">{children}</main>
    </div>
  )
}
