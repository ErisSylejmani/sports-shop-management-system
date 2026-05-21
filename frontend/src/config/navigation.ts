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

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/perdoruesit', label: 'Përdoruesit', icon: UserCog },
  { to: '/admin/rolet', label: 'Rolet', icon: Shield },
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

const managerNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
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

export function getNavItems(role: AppRole): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNav
    case 'manager':
      return managerNav
    case 'staff':
      return staffNav
  }
}
