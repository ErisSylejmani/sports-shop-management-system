import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, RotateCcw, Search } from 'lucide-react'
import { listKthimet } from '../api/kthimet'
import { listProdukte } from '../api/catalog'
import { listShitjet } from '../api/shitje'
import type { KthimDto, ProduktDto, ShitjeSummaryDto } from '../api/types'
import { canCreateKthim } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { resolveApiError } from '../lib/errors'
import { formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'
import { useAuth } from '../context/AuthContext'

function statusClass(statusi: string): string {
  const s = statusi.toLowerCase()
  if (s.includes('aprov') || s.includes('perfund') || s.includes('komplet'))
    return 'bg-emerald-100 text-emerald-800'
  if (s.includes('prit') || s.includes('pending'))
    return 'bg-amber-100 text-amber-800'
  if (s.includes('refuz') || s.includes('anul'))
    return 'bg-red-100 text-red-800'
  return 'bg-slate-100 text-slate-700'
}

export function KthimetPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = canCreateKthim(user?.roles)

  const [items, setItems] = useState<KthimDto[]>([])
  const [shitjet, setShitjet] = useState<ShitjeSummaryDto[]>([])
  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [filterShitjeId, setFilterShitjeId] = useState('')
  const [filterProduktId, setFilterProduktId] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params: { shitjeId?: string; produktId?: string } = {}
      if (filterShitjeId) params.shitjeId = filterShitjeId
      if (filterProduktId) params.produktId = filterProduktId
      const data = await listKthimet(params)
      setItems(data)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të kthimeve.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([listShitjet(), listProdukte()])
      .then(([s, p]) => {
        setShitjet(s)
        setProdukte(p)
      })
      .catch(() => {
        /* filtrat mbeten bosh nëse dështojnë */
      })
  }, [])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rifresko kur ndryshojnë filtrat API
  }, [filterShitjeId, filterProduktId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((k) =>
      [k.produktEmri, k.arsyeja, k.statusi].some((x) => x.toLowerCase().includes(q)),
    )
  }, [items, query])

  const shitjeOptions = useMemo(
    () =>
      shitjet.map((s) => ({
        value: s.shitjeId,
        label: `${formatDateTime(s.dataShitjes)} — ${s.klientEmri}`,
      })),
    [shitjet],
  )

  const produktOptions = useMemo(
    () =>
      produkte.map((p) => ({
        value: p.produktId,
        label: p.emri,
      })),
    [produkte],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RotateCcw}
        title="Kthimet"
        subtitle="Lista e kthimeve të mallit me filtra sipas shitjes dhe produktit."
        actions={
          canCreate ? (
            <Button type="button" onClick={() => navigate('/kthimet/e-re')}>
              <Plus className="h-4 w-4" />
              Kthim i ri
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-3">
          <Select
            label="Filtro sipas shitjes"
            value={filterShitjeId}
            onChange={(e) => setFilterShitjeId(e.target.value)}
          >
            <option value="">Të gjitha shitjet</option>
            {shitjeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Filtro sipas produktit"
            value={filterProduktId}
            onChange={(e) => setFilterProduktId(e.target.value)}
          >
            <option value="">Të gjithë produktet</option>
            {produktOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Kërkim lokal"
            placeholder="Produkt, arsye, status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                query || filterShitjeId || filterProduktId
                  ? 'Nuk ka kthime për filtrat aktual.'
                  : 'Nuk ka kthime të regjistruara.'
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Data kthimit</Th>
                  <Th>Produkti</Th>
                  <Th className="text-right">Sasia</Th>
                  <Th>Arsyeja</Th>
                  <Th>Statusi</Th>
                  <Th>Data shitjes</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <Tr key={k.kthimId}>
                    <Td className="whitespace-nowrap">{formatDateTime(k.dataKthimit)}</Td>
                    <Td className="font-medium text-slate-900">{k.produktEmri}</Td>
                    <Td className="text-right">{k.sasia}</Td>
                    <Td className="max-w-xs truncate" title={k.arsyeja}>
                      {k.arsyeja}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusClass(k.statusi),
                        )}
                      >
                        {k.statusi}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      {formatDateTime(k.dataShitjes)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        to={`/shitjet/${k.shitjeId}`}
                        className="text-sm font-medium text-[var(--accent)] hover:underline"
                      >
                        Shitja
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
