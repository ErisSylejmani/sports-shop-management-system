import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, RotateCcw, Search } from 'lucide-react'
import {
  deleteKthim,
  listKthimet,
  updateKthim,
  type UpdateKthimPayload,
} from '../api/kthimet'
import { listProdukte } from '../api/catalog'
import { listShitjet } from '../api/shitje'
import type { KthimDto, ProduktDto, ShitjeSummaryDto } from '../api/types'
import { canCreateKthim, canMutateKthim } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

const STATUS_OPTIONS = ['Në pritje', 'Aprovuar', 'Refuzuar', 'Anuluar'] as const

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

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type EditForm = {
  sasia: string
  arsyeja: string
  statusi: string
  dataKthimit: string
}

export function KthimetPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = canCreateKthim(user?.roles)
  const canMutate = canMutateKthim(user?.roles)
  const isStaff = user?.isStaff ?? false

  const [items, setItems] = useState<KthimDto[]>([])
  const [shitjet, setShitjet] = useState<ShitjeSummaryDto[]>([])
  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [filterShitjeId, setFilterShitjeId] = useState('')
  const [filterProduktId, setFilterProduktId] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<KthimDto | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    sasia: '1',
    arsyeja: '',
    statusi: STATUS_OPTIONS[0],
    dataKthimit: '',
  })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const pageSubtitle = isStaff
    ? 'Stafi mund të regjistrojë kthime të reja; ndryshimi dhe fshirja janë për menaxherin.'
    : 'Lista e kthimeve të mallit me filtra sipas shitjes dhe produktit.'

  function openEdit(item: KthimDto) {
    if (!canMutate) return
    setEditing(item)
    setEditForm({
      sasia: String(item.sasia),
      arsyeja: item.arsyeja,
      statusi: item.statusi,
      dataKthimit: toDatetimeLocalValue(item.dataKthimit),
    })
    setActionError(null)
  }

  function closeEdit() {
    setEditing(null)
    setActionError(null)
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!canMutate || !editing) return

    const sasia = Number(editForm.sasia)
    if (!Number.isFinite(sasia) || sasia <= 0) {
      setActionError('Sasia duhet të jetë më e madhe se zero.')
      return
    }

    const arsyeja = editForm.arsyeja.trim()
    if (!arsyeja) {
      setActionError('Arsyeja është e detyrueshme.')
      return
    }

    const statusi = editForm.statusi.trim()
    if (!statusi) {
      setActionError('Zgjidhni statusin.')
      return
    }

    if (!editForm.dataKthimit) {
      setActionError('Data e kthimit është e detyrueshme.')
      return
    }

    const payload: UpdateKthimPayload = {
      sasia,
      arsyeja,
      statusi,
      dataKthimit: new Date(editForm.dataKthimit).toISOString(),
    }

    setSaving(true)
    setActionError(null)
    try {
      await updateKthim(editing.kthimId, payload)
      closeEdit()
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Ruajtja e kthimit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: KthimDto) {
    if (!canMutate) return
    if (!confirm(`Fshi kthimin për "${item.produktEmri}" (${item.sasia} copë)?`)) return

    setActionError(null)
    try {
      await deleteKthim(item.kthimId)
      if (editing?.kthimId === item.kthimId) closeEdit()
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja e kthimit dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RotateCcw}
        title="Kthimet"
        subtitle={pageSubtitle}
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
      {actionError && !editing && <Alert variant="error">{actionError}</Alert>}

      {editing && canMutate && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Ndrysho kthimin</h2>
            <p className="mt-1 text-sm text-slate-500">
              {editing.produktEmri} —{' '}
              <Link
                to={`/shitjet/${editing.shitjeId}`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Shitja
              </Link>
            </p>
          </CardHeader>
          <CardBody>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => void onSaveEdit(e)}>
              <Input
                label="Sasia"
                type="number"
                min={1}
                required
                value={editForm.sasia}
                onChange={(e) => setEditForm((f) => ({ ...f, sasia: e.target.value }))}
              />
              <Input
                label="Data e kthimit"
                type="datetime-local"
                required
                value={editForm.dataKthimit}
                onChange={(e) => setEditForm((f) => ({ ...f, dataKthimit: e.target.value }))}
              />
              <Select
                label="Statusi"
                required
                value={editForm.statusi}
                onChange={(e) => setEditForm((f) => ({ ...f, statusi: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <div className="sm:col-span-2">
                <Textarea
                  label="Arsyeja"
                  required
                  rows={3}
                  value={editForm.arsyeja}
                  onChange={(e) => setEditForm((f) => ({ ...f, arsyeja: e.target.value }))}
                />
              </div>
              {actionError && (
                <p className="sm:col-span-2 text-sm text-red-600">{actionError}</p>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-2 border-t border-slate-100 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur…' : 'Ruaj ndryshimet'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeEdit}>
                  Anulo
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

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
            <TableSkeleton rows={6} cols={canMutate ? 8 : 7} />
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
                  {canMutate && <Th className="text-right">Veprime</Th>}
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
                    {canMutate && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => openEdit(k)}>
                            Ndrysho
                          </Button>
                          <Button variant="danger" onClick={() => void onDelete(k)}>
                            Fshi
                          </Button>
                        </div>
                      </Td>
                    )}
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
