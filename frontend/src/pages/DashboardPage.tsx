import { BarChart3, Package, ShoppingCart, Users } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { useRoleTheme } from '../context/RoleThemeContext'
import { cn } from '../lib/cn'
import { roleLabel } from '../auth/roles'

const statMeta = [
  { label: 'Produkte', value: '—', icon: Package },
  { label: 'Shitje sot', value: '—', icon: ShoppingCart },
  { label: 'Klientë', value: '—', icon: Users },
  { label: 'Të ardhura', value: '—', icon: BarChart3 },
]

export function DashboardPage() {
  const { role, theme } = useRoleTheme()

  return (
    <>
      <PageHeader
        title={`Mirë se vini, ${roleLabel(role)}!`}
        subtitle={
          role === 'staff'
            ? 'Paneli i stafit — theks jeshil (shitje & kthime).'
            : 'Paneli i menaxhimit — theks blu.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statMeta.map((item, i) => (
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Përmbledhje shitjesh</h2>
          </CardHeader>
          <CardBody>
            <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
              Grafiku — F2
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Aktiviteti i fundit</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-slate-500">
            <p>Lista e shitjeve të fundit — F2</p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
