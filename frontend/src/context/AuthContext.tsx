import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMe, login as apiLogin, logout as apiLogout } from '../api/auth'
import { ApiError, setUnauthorizedHandler } from '../api/client'
import type { AuthUser } from '../auth/types'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/token'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const clearSession = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      return
    }
    const me = await fetchMe()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) await apiLogout(refresh)
    } catch {
      // Revokimi në server është opsional; sesioni lokale pastrohet gjithsesi.
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }, [clearSession, navigate])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession, navigate])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setIsBootstrapping(false)
        }
        return
      }

      try {
        const me = await fetchMe()
        if (!cancelled) setUser(me)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) clearTokens()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      clearTokens()
      const res = await apiLogin({ email: email.trim(), password })
      setTokens(res.accessToken, res.refreshToken)
      const me = await fetchMe()
      setUser(me)
      navigate('/', { replace: true })
    },
    [navigate],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user && !!getAccessToken(),
      isBootstrapping,
      login,
      logout,
      refreshUser,
    }),
    [user, isBootstrapping, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth duhet brenda AuthProvider')
  return ctx
}
