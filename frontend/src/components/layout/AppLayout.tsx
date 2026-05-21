import { Outlet } from 'react-router-dom'
import { Bell, Search, UserCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Sidebar } from './Sidebar'
import { useRoleTheme } from '../../context/RoleThemeContext'
import { roleLabel, setPreviewRole, type AppRole } from '../../auth/roles'

export function AppLayout() {
  const { role, theme, setRole } = useRoleTheme()

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r px-6 py-4 text-white shadow-md',
            theme.header,
          )}
        >
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              placeholder="Kërko..."
              className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 sm:flex-none">
            <span className={cn('hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline', theme.badge)}>
              {roleLabel(role)}
            </span>

            {/* F0: ndërrim teme për preview — zëvendësohet nga /api/me në F1 */}
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as AppRole
                setRole(r)
                setPreviewRole(r)
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white"
              title="Preview roli (F0)"
            >
              <option value="admin">Admin (blu)</option>
              <option value="manager">Menaxher (blu)</option>
              <option value="staff">Staf (gjelbër)</option>
            </select>

            <button
              type="button"
              className="rounded-xl p-2 text-white/80 transition hover:bg-white/10"
              aria-label="Njoftime"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
              <UserCircle className="h-8 w-8 text-white/90" />
              <span className="hidden text-sm font-medium sm:inline">Përdoruesi</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
