export type AppRole = 'admin' | 'manager' | 'staff'

const PREVIEW_ROLE_KEY = 'sports_shop_preview_role'

export function getPreviewRole(): AppRole {
  const stored = localStorage.getItem(PREVIEW_ROLE_KEY)
  if (stored === 'admin' || stored === 'manager' || stored === 'staff') return stored
  return 'manager'
}

export function setPreviewRole(role: AppRole) {
  localStorage.setItem(PREVIEW_ROLE_KEY, role)
}

export function resolveAppRole(apiRoles: string[]): AppRole {
  if (apiRoles.includes('Admin')) return 'admin'
  if (apiRoles.includes('Manager')) return 'manager'
  return 'staff'
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'manager':
      return 'Menaxher'
    case 'staff':
      return 'Staf'
  }
}
