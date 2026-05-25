import { useEffect, useState } from 'react'
import { AlertCircle, Package, Percent, ShoppingCart, Users } from 'lucide-react'
import { fetchDashboardStats, type DashboardStats } from '../api/dashboard'
import { ApiError } from '../api/client'
import { roleLabel, type AppRole } from '../auth/roles'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { SalesListSkeleton, StatCardSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useRoleTheme } from '../context/RoleThemeContext'
import { formatCurrency, formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

function getWelcomeTitle(
  isStaff: boolean,
  punetorEmri: string | null | undefined,
  emri: string,
  mbiemri: string,
  role: AppRole,
): string {
  if (isStaff && punetorEmri?.trim()) {
    return `Mirë se vini, ${punetorEmri.trim()}!`
  }
  const name = [emri, mbiemri].filter(Boolean).join(' ').trim()
  if (name) return `Mirë se vini, ${name}!`
  return `Mirë se vini, ${roleLabel(role)}!`
}

function getWelcomeSubtitle(isStaff: boolean): string {
  if (isStaff) {
    return 'Paneli i stafit — regjistrim shitjesh dhe kthime.'
  }
  return 'Paneli i menaxhimit — përmbledhje e dyqanit.'
}

function resolveErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message
    if (err.status === 401) return 'Sesioni ka skaduar. Hyni përsëri.'
    if (err.status === 403) return 'Nuk keni leje për të parë këto të dhëna.'
    return err.message
  }
  return 'Nuk u arrit të ngarkohen të dhënat e panelit. Kontrolloni që API është aktiv.'
}

export function DashboardPage() {
  const { user } = useAuth()
  const { role, theme } = useRoleTheme()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDashboardStats()
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) {
          setStats(null)
          setError(resolveErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = stats
    ? [
        { label: 'Produkte', value: String(stats.produkteCount), icon: Package },
        { label: 'Shitje sot', value: String(stats.shitjeSotCount), icon: ShoppingCart },
        { label: 'Klientë', value: String(stats.klientetCount), icon: Users },
        {
          label: 'Oferta aktive',
          value: String(stats.ofertatAktiveCount),
          icon: Percent,
        },
      ]
    : []

  const title = user
    ? getWelcomeTitle(user.isStaff, user.punetorEmri, user.emri, user.mbiemri, role)
    : `Mirë se vini, ${roleLabel(role)}!`

  const subtitle = user ? getWelcomeSubtitle(user.isStaff) : undefined

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg',
                  theme.statCards[i % theme.statCards.length],
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold">{item.value}</p>
                  </div>
                  <item.icon className="h-8 w-8 text-white/60" />
                </div>
              </div>
            ))}
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Shitjet e fundit</h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <SalesListSkeleton />
            ) : stats && stats.recentShitje.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.recentShitje.map((s) => (
                  <li
                    key={s.shitjeId}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{s.klientEmri}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(s.dataShitjes)} · {s.metodaPageses}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(s.shumaTotale)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nuk ka shitje të regjistruara ende.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
