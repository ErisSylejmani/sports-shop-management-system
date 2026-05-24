import { useEffect } from 'react'
import { resolveAppRole } from '../../auth/roles'
import { useAuth } from '../../context/AuthContext'
import { useRoleTheme } from '../../context/RoleThemeContext'

/** Sinkronizon temën e layout-it me rolet nga /api/me. */
export function AuthRoleSync() {
  const { user } = useAuth()
  const { setRole } = useRoleTheme()

  useEffect(() => {
    if (!user) return
    setRole(resolveAppRole(user.roles))
  }, [user, setRole])

  return null
}
