import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Package, Percent, ShoppingCart, Users } from 'lucide-react'
import { fetchDashboardData, type DashboardData } from '../api/dashboard'
import { ApiError } from '../api/client'
import { roleLabel, type AppRole } from '../auth/roles'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { SalesListSkeleton, StatCardSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th } from '../components/ui/Table'
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
  return 'Përmbledhje e inventarit, shitjeve dhe ofertave.'
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
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchDashboardData()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setData(null)
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

  const statCards = data
    ? [
        { label: 'Produkte', value: String(data.produktCount), icon: Package },
        { label: 'Shitje sot', value: String(data.shitjeSotCount), icon: ShoppingCart },
        { label: 'Klientë', value: String(data.klientCount), icon: Users },
        { label: 'Oferta aktive', value: String(data.ofertaAktiveCount), icon: Percent },
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

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h2 className="font-semibold text-slate-800">Shitjet e fundit</h2>
          <Link
            to="/shitjet"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Shiko të gjitha
          </Link>
        </CardHeader>
        <CardBody className={loading || (data && data.recentShitjet.length > 0) ? undefined : 'py-10'}>
          {loading ? (
            <SalesListSkeleton />
          ) : data && data.recentShitjet.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Klienti</Th>
                  <Th>Punëtori</Th>
                  <Th>Pagesa</Th>
                  <Th className="text-right">Shuma</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentShitjet.map((s) => (
                  <tr key={s.shitjeId} className="hover:bg-slate-50/80">
                    <Td className="whitespace-nowrap text-slate-600">
                      {formatDateTime(s.dataShitjes)}
                    </Td>
                    <Td className="font-medium">{s.klientEmri}</Td>
                    <Td>{s.punetorEmri}</Td>
                    <Td>{s.metodaPageses}</Td>
                    <Td className="text-right font-semibold text-slate-900">
                      {formatCurrency(s.shumaTotale)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-sm text-slate-500">
              Nuk ka shitje të regjistruara ende.
            </p>
          )}
        </CardBody>
      </Card>
    </>
  )
}
