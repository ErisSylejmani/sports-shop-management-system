import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getPreviewRole, type AppRole } from '../auth/roles'
import { roleThemes, type RoleTheme } from '../theme/themes'

type RoleThemeContextValue = {
  role: AppRole
  theme: RoleTheme
  setRole: (role: AppRole) => void
}

const RoleThemeContext = createContext<RoleThemeContextValue | null>(null)

export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole>(() => getPreviewRole())

  const setRole = useCallback((next: AppRole) => {
    setRoleState(next)
    localStorage.setItem('sports_shop_preview_role', next)
  }, [])

  const theme = roleThemes[role]

  useEffect(() => {
    document.documentElement.classList.remove('theme-admin', 'theme-manager', 'theme-staff')
    document.documentElement.classList.add(theme.rootClass)
  }, [theme.rootClass])

  const value = useMemo(() => ({ role, theme, setRole }), [role, theme, setRole])

  return (
    <RoleThemeContext.Provider value={value}>{children}</RoleThemeContext.Provider>
  )
}

export function useRoleTheme() {
  const ctx = useContext(RoleThemeContext)
  if (!ctx) throw new Error('useRoleTheme duhet brenda RoleThemeProvider')
  return ctx
}
