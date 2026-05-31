import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Truck,
  ClipboardList,
  ShoppingCart,
  RotateCcw,
  Percent,
  UserCog,
  Shield,
} from 'lucide-react'
import type { AppRole } from '../auth/roles'
import { canAccessAdmin } from '../auth/permissions'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const adminOnlyNav: NavItem[] = [
  { to: '/admin/perdoruesit', label: 'Përdoruesit', icon: UserCog },
  { to: '/admin/rolet', label: 'Rolet', icon: Shield },
]

const sharedNav: NavItem[] = [
  { to: '/produkte', label: 'Produktet', icon: Package },
  { to: '/kategorite', label: 'Kategoritë', icon: Tags },
  { to: '/shitjet', label: 'Shitjet', icon: ShoppingCart },
  { to: '/kthimet', label: 'Kthimet', icon: RotateCcw },
  { to: '/klientet', label: 'Klientët', icon: Users },
  { to: '/punetoret', label: 'Punëtorët', icon: Users },
  { to: '/furnitore', label: 'Furnitorët', icon: Truck },
  { to: '/porosi-furnitore', label: 'Porosi furnitori', icon: ClipboardList },
  { to: '/ofertat', label: 'Ofertat', icon: Percent },
]

const staffNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shitjet', label: 'Shitjet', icon: ShoppingCart },
  { to: '/shitjet/e-re', label: 'Shitje e re', icon: ShoppingCart },
  { to: '/kthimet', label: 'Kthimet', icon: RotateCcw },
  { to: '/produkte', label: 'Produktet', icon: Package },
  { to: '/klientet', label: 'Klientët', icon: Users },
]

function withAdminSection(items: NavItem[], apiRoles: string[] | undefined): NavItem[] {
  if (!canAccessAdmin(apiRoles)) {
    return items.filter((item) => !item.to.startsWith('/admin'))
  }
  const dashboard = items.find((item) => item.to === '/')
  const rest = items.filter((item) => item.to !== '/' && !item.to.startsWith('/admin'))
  return dashboard
    ? [dashboard, ...adminOnlyNav, ...rest]
    : [...adminOnlyNav, ...rest]
}

/** Sidebar: admin-only linket shfaqen vetëm kur JWT ka rol Admin. */
export function getNavItems(role: AppRole, apiRoles?: string[]): NavItem[] {
  switch (role) {
    case 'admin': {
      const items: NavItem[] = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        ...sharedNav,
      ]
      return withAdminSection(items, apiRoles)
    }
    case 'manager':
      return [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        ...sharedNav,
      ]
    case 'staff':
      return staffNav
  }
}
