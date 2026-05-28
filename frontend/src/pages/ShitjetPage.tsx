import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import { listShitjet } from '../api/shitje'
import { listKlientet } from '../api/klientet'
import { listPunetoret } from '../api/punetoret'
import type { KlientDto, PunetorDto, ShitjeSummaryDto } from '../api/types'
import { canCreateShitje } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatCurrency, formatDateTime } from '../lib/format'

export function ShitjetPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = canCreateShitje(user?.roles)

  const [items, setItems] = useState<ShitjeSummaryDto[]>([])
  const [klientet, setKlientet] = useState<KlientDto[]>([])
  const [punetoret, setPunetoret] = useState<PunetorDto[]>([])
  const [filterKlientId, setFilterKlientId] = useState('')
  const [filterPunetorId, setFilterPunetorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params: { klientId?: string; punetorId?: string } = {}
      if (filterKlientId) params.klientId = filterKlientId
      if (filterPunetorId) params.punetorId = filterPunetorId
      const data = await listShitjet(params)
      setItems(data)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të shitjeve.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([listKlientet(), listPunetoret()])
      .then(([k, p]) => {
        setKlientet(k)
        setPunetoret(p)
      })
      .catch(() => {
        /* filtrat mbeten bosh nëse dështojnë */
      })
  }, [])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rifresko kur ndryshojnë filtrat
  }, [filterKlientId, filterPunetorId])

  const klientOptions = useMemo(
    () =>
      klientet.map((k) => ({
        value: k.klientId,
        label: `${k.emri} ${k.mbiemri}`,
      })),
    [klientet],
  )

  const punetorOptions = useMemo(
    () =>
      punetoret.map((p) => ({
        value: p.punetorId,
        label: `${p.emri} ${p.mbiemri}`,
      })),
    [punetoret],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shitjet"
        subtitle="Lista e shitjeve me filtra opsionale sipas klientit dhe punëtorit."
        icon={ShoppingCart}
        actions={
          canCreate ? (
            <Button type="button" onClick={() => navigate('/shitjet/e-re')}>
              <Plus className="h-4 w-4" />
              Shitje e re
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Filtro sipas klientit"
            value={filterKlientId}
            onChange={(e) => setFilterKlientId(e.target.value)}
          >
            <option value="">Të gjithë klientët</option>
            {klientOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Filtro sipas punëtorit"
            value={filterPunetorId}
            onChange={(e) => setFilterPunetorId(e.target.value)}
          >
            <option value="">Të gjithë punëtorët</option>
            {punetorOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardBody className={loading || items.length > 0 ? undefined : 'py-12'}>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              Nuk u gjetën shitje{filterKlientId || filterPunetorId ? ' për filtrat e zgjedhur' : ''}.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Klienti</Th>
                  <Th>Punëtori</Th>
                  <Th className="text-right">Zbritja</Th>
                  <Th className="text-right">Totali</Th>
                  <Th>Pagesa</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <Tr key={s.shitjeId}>
                    <Td>{formatDateTime(s.dataShitjes)}</Td>
                    <Td>{s.klientEmri}</Td>
                    <Td>{s.punetorEmri}</Td>
                    <Td className="text-right">{formatCurrency(s.zbritja)}</Td>
                    <Td className="text-right font-medium">{formatCurrency(s.shumaTotale)}</Td>
                    <Td>{s.metodaPageses}</Td>
                    <Td className="text-right">
                      <Link
                        to={`/shitjet/${s.shitjeId}`}
                        className="text-sm font-medium text-[var(--accent)] hover:underline"
                      >
                        Detaj
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
