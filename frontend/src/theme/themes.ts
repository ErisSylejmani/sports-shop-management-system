import type { AppRole } from '../auth/roles'

export type RoleTheme = {
  id: AppRole
  /** Klasë në <html> për CSS variables */
  rootClass: string
  label: string
  sidebar: string
  sidebarActive: string
  sidebarText: string
  sidebarMuted: string
  accent: string
  accentHover: string
  badge: string
  header: string
  statCards: string[]
}

export const roleThemes: Record<AppRole, RoleTheme> = {
  admin: {
    id: 'admin',
    rootClass: 'theme-admin',
    label: 'Admin',
    sidebar: 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900',
    sidebarActive: 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/40',
    sidebarText: 'text-blue-50',
    sidebarMuted: 'text-blue-200/70 hover:bg-white/10 hover:text-white',
    accent: 'bg-blue-600 hover:bg-blue-500 text-white',
    accentHover: 'hover:bg-blue-500',
    badge: 'bg-blue-500/20 text-blue-100 border border-blue-400/30',
    header: 'from-slate-900 to-blue-900',
    statCards: [
      'from-blue-700 to-blue-900',
      'from-sky-600 to-blue-800',
      'from-indigo-600 to-blue-900',
      'from-cyan-600 to-blue-800',
    ],
  },
  manager: {
    id: 'manager',
    rootClass: 'theme-manager',
    label: 'Menaxher',
    sidebar: 'bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900',
    sidebarActive: 'bg-sky-600/90 text-white shadow-lg shadow-sky-900/40',
    sidebarText: 'text-sky-50',
    sidebarMuted: 'text-sky-200/70 hover:bg-white/10 hover:text-white',
    accent: 'bg-sky-600 hover:bg-sky-500 text-white',
    accentHover: 'hover:bg-sky-500',
    badge: 'bg-sky-500/20 text-sky-100 border border-sky-400/30',
    header: 'from-slate-900 to-sky-900',
    statCards: [
      'from-sky-700 to-sky-900',
      'from-blue-600 to-sky-800',
      'from-teal-600 to-sky-900',
      'from-cyan-500 to-sky-800',
    ],
  },
  staff: {
    id: 'staff',
    rootClass: 'theme-staff',
    label: 'Staf',
    sidebar: 'bg-gradient-to-b from-emerald-950 via-green-950 to-slate-900',
    sidebarActive: 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-900/40',
    sidebarText: 'text-emerald-50',
    sidebarMuted: 'text-emerald-200/70 hover:bg-white/10 hover:text-white',
    accent: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    accentHover: 'hover:bg-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30',
    header: 'from-emerald-950 to-green-900',
    statCards: [
      'from-emerald-700 to-emerald-900',
      'from-green-600 to-emerald-800',
      'from-lime-600 to-green-900',
      'from-teal-600 to-emerald-800',
    ],
  },
}
