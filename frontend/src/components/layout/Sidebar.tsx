import { NavLink } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { useRoleTheme } from '../../context/RoleThemeContext'
import { getNavItems } from '../../config/navigation'

export function Sidebar() {
  const { user } = useAuth()
  const { role, theme } = useRoleTheme()
  const items = getNavItems(role, user?.roles)

  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-white/10 shadow-xl',
        theme.sidebar,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Dumbbell className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-lg font-bold italic tracking-tight text-white">Sports Shop</p>
          <p className={cn('text-xs font-medium uppercase tracking-wider', theme.sidebarText)}>
            {theme.label} panel
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? theme.sidebarActive : theme.sidebarMuted,
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0 opacity-90" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="px-5 py-4 text-center text-[10px] text-white/40">© Sports Shop</p>
    </aside>
  )
}
