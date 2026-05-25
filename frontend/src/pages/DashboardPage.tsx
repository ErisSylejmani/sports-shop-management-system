import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Percent, ShoppingCart, Users } from 'lucide-react'
import { fetchDashboardData, type DashboardData } from '../api/dashboard'
import { ApiError } from '../api/client'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Table, Td, Th } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { useRoleTheme } from '../context/RoleThemeContext'
import { cn } from '../lib/cn'
import { roleLabel } from '../auth/roles'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(value: number) {
  return `${value.toLocaleString('sq-AL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-slate-200 p-5">
      <div className="h-4 w-24 rounded bg-slate-300" />
      <div className="mt-4 h-9 w-16 rounded bg-slate-300" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        </CardHeader>
        <CardBody className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </CardBody>
      </Card>
    </>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { role, theme } = useRoleTheme()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
          setError(
            err instanceof ApiError
              ? err.message
              : 'Nuk u arrit të ngarkohen të dhënat e dashboard-it.',
          )
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

  const welcomeTitle = user?.isStaff && user.punetorEmri
    ? `Mirë se vini, ${user.punetorEmri}!`
    : user
      ? `Mirë se vini, ${user.emri}!`
      : `Mirë se vini, ${roleLabel(role)}!`

  const statCards = data
    ? [
        { label: 'Produkte', value: String(data.produktCount), icon: Package },
        { label: 'Shitje (total)', value: String(data.shitjeCount), icon: ShoppingCart },
        { label: 'Klientë', value: String(data.klientCount), icon: Users },
        { label: 'Oferta aktive', value: String(data.ofertaAktiveCount), icon: Percent },
      ]
    : []

  return (
    <>
      <PageHeader
        title={welcomeTitle}
        subtitle={
          role === 'staff'
            ? 'Paneli i stafit — shitje dhe kthime.'
            : 'Përmbledhje e inventarit, shitjeve dhe ofertave.'
        }
      />

      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <p className="mt-2 text-sm text-slate-500">
              Sigurohuni që jeni i loguar dhe backend-i është aktiv.
            </p>
          </CardBody>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item, i) => (
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
            <CardBody className="p-0 sm:p-0">
              {data.recentShitjet.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  Nuk ka shitje të regjistruara ende.
                </p>
              ) : (
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
                        <Td className="whitespace-nowrap text-slate-600">{formatDate(s.dataShitjes)}</Td>
                        <Td className="font-medium">{s.klientEmri}</Td>
                        <Td>{s.punetorEmri}</Td>
                        <Td>{s.metodaPageses}</Td>
                        <Td className="text-right font-semibold text-slate-900">
                          {formatMoney(s.shumaTotale)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </>
  )
}
