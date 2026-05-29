import { useEffect, useMemo, useState } from 'react'
import { Percent } from 'lucide-react'
import {
  createOferta,
  deleteOferta,
  getOferta,
  listOfertat,
  type OfertaPayload,
  updateOferta,
} from '../api/ofertat'
import { listProdukte } from '../api/catalog'
import type { OfertaDetailDto, OfertaSummaryDto, ProduktDto } from '../api/types'
import { canWriteOferta } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { ReadOnlyBadge } from '../components/layout/ReadOnlyBadge'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatDateTime } from '../lib/format'

const STATUS_OPTIONS = ['Aktive', 'Joaktive', 'Ne_Pritje'] as const

const initialForm = {
  emri: '',
  pershkrimi: '',
  perqindjaZbritjes: '0',
  dataFillimit: '',
  dataPerfundimit: '',
  statusi: 'Aktive',
  produktIds: [] as string[],
}

function toDateInputValue(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function dateToIsoStart(date: string) {
  return new Date(`${date}T00:00:00`).toISOString()
}

function dateToIsoEnd(date: string) {
  return new Date(`${date}T23:59:59`).toISOString()
}

export function OfertatPage() {
  const { user } = useAuth()
  const canWrite = canWriteOferta(user?.roles)

  const [items, setItems] = useState<OfertaSummaryDto[]>([])
  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [detail, setDetail] = useState<OfertaDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [produktFilter, setProduktFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [ofertat, pr] = await Promise.all([listOfertat(), listProdukte()])
      setItems(ofertat)
      setProdukte(pr)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të ofertave.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredProdukte = useMemo(() => {
    const q = produktFilter.trim().toLowerCase()
    if (!q) return produkte
    return produkte.filter((p) =>
      [p.emri, p.marka, p.kategoriEmri].some((x) => x.toLowerCase().includes(q)),
    )
  }, [produkte, produktFilter])

  async function openDetail(id: string) {
    try {
      setDetail(await getOferta(id))
      setActionError(null)
    } catch (err) {
      setActionError(resolveApiError(err, 'Leximi i detajit dështoi.'))
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(initialForm)
    setActionError(null)
    setShowForm(true)
  }

  async function openEdit(id: string) {
    if (!canWrite) return
    try {
      const d = await getOferta(id)
      setEditingId(id)
      setForm({
        emri: d.emri,
        pershkrimi: d.pershkrimi ?? '',
        perqindjaZbritjes: String(d.perqindjaZbritjes),
        dataFillimit: toDateInputValue(d.dataFillimit),
        dataPerfundimit: toDateInputValue(d.dataPerfundimit),
        statusi: d.statusi,
        produktIds: d.produktet.map((p) => p.produktId),
      })
      setProduktFilter('')
      setActionError(null)
      setShowForm(true)
    } catch (err) {
      setActionError(resolveApiError(err, 'Ngarkimi për edit dështoi.'))
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(initialForm)
    setProduktFilter('')
    setActionError(null)
  }

  function toggleProdukt(produktId: string) {
    setForm((f) => ({
      ...f,
      produktIds: f.produktIds.includes(produktId)
        ? f.produktIds.filter((id) => id !== produktId)
        : [...f.produktIds, produktId],
    }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return

    const perqindja = Number(form.perqindjaZbritjes)
    if (!form.emri.trim()) {
      setActionError('Emri i ofertës është i detyrueshëm.')
      return
    }
    if (Number.isNaN(perqindja) || perqindja < 0 || perqindja > 100) {
      setActionError('Përqindja e zbritjes duhet të jetë midis 0 dhe 100.')
      return
    }
    if (!form.dataFillimit || !form.dataPerfundimit) {
      setActionError('Plotësoni datat e fillimit dhe përfundimit.')
      return
    }
    if (form.dataPerfundimit < form.dataFillimit) {
      setActionError('Data e përfundimit nuk mund të jetë para fillimit.')
      return
    }

    const payload: OfertaPayload = {
      emri: form.emri.trim(),
      pershkrimi: form.pershkrimi.trim() || null,
      perqindjaZbritjes: perqindja,
      dataFillimit: dateToIsoStart(form.dataFillimit),
      dataPerfundimit: dateToIsoEnd(form.dataPerfundimit),
      statusi: form.statusi,
      produktIds: form.produktIds,
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editingId) {
        const updated = await updateOferta(editingId, payload)
        setDetail(updated)
      } else {
        const created = await createOferta(payload)
        setDetail(created)
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(resolveApiError(err, 'Ruajtja e ofertës dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!canWrite) return
    if (!confirm('Fshi këtë ofertë?')) return
    try {
      await deleteOferta(id)
      if (detail?.ofertaId === id) setDetail(null)
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ofertat"
        subtitle="Menaxhoni ofertat me zbritje dhe produkte të lidhura."
        icon={Percent}
        actions={
          canWrite ? (
            <Button type="button" onClick={openCreate}>
              Shto ofertë
            </Button>
          ) : (
            <ReadOnlyBadge />
          )
        }
      />

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editingId ? 'Ndrysho ofertën' : 'Ofertë e re'}
            </h2>
          </CardHeader>
          <CardBody>
            {actionError && <Alert variant="error" className="mb-4">{actionError}</Alert>}
            <form onSubmit={(e) => void onSave(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Emri"
                  required
                  value={form.emri}
                  onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))}
                />
                <Input
                  label="Përqindja e zbritjes (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  required
                  value={form.perqindjaZbritjes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, perqindjaZbritjes: e.target.value }))
                  }
                />
                <Input
                  label="Data e fillimit"
                  type="date"
                  required
                  value={form.dataFillimit}
                  onChange={(e) => setForm((f) => ({ ...f, dataFillimit: e.target.value }))}
                />
                <Input
                  label="Data e përfundimit"
                  type="date"
                  required
                  value={form.dataPerfundimit}
                  onChange={(e) => setForm((f) => ({ ...f, dataPerfundimit: e.target.value }))}
                />
                <Select
                  label="Statusi"
                  required
                  value={form.statusi}
                  onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Përshkrimi (opsional)"
                rows={2}
                value={form.pershkrimi}
                onChange={(e) => setForm((f) => ({ ...f, pershkrimi: e.target.value }))}
              />

              <div>
                <p className="mb-2 text-sm font-medium text-slate-600">
                  Produktet ({form.produktIds.length} të zgjedhura)
                </p>
                <Input
                  placeholder="Filtro produktet…"
                  value={produktFilter}
                  onChange={(e) => setProduktFilter(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {filteredProdukte.length === 0 ? (
                    <p className="text-sm text-slate-500">Nuk u gjetën produkte.</p>
                  ) : (
                    filteredProdukte.map((p) => (
                      <label
                        key={p.produktId}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.produktIds.includes(p.produktId)}
                          onChange={() => toggleProdukt(p.produktId)}
                          className="rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent-ring)]"
                        />
                        <span className="text-sm text-slate-800">
                          {p.emri}
                          <span className="ml-1 text-slate-500">({p.marka})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur…' : editingId ? 'Ruaj ndryshimet' : 'Krijo ofertën'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  Anulo
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className={loading || items.length > 0 ? undefined : 'py-12'}>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Nuk ka oferta të regjistruara.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th className="text-right">Zbritja</Th>
                  <Th>Fillimi</Th>
                  <Th>Përfundimi</Th>
                  <Th>Statusi</Th>
                  <Th className="text-right">Produkte</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <Tr key={o.ofertaId}>
                    <Td className="font-medium">{o.emri}</Td>
                    <Td className="text-right">{o.perqindjaZbritjes}%</Td>
                    <Td>{formatDateTime(o.dataFillimit)}</Td>
                    <Td>{formatDateTime(o.dataPerfundimit)}</Td>
                    <Td>{o.statusi.replace('_', ' ')}</Td>
                    <Td className="text-right">{o.numriProdukteve}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => void openDetail(o.ofertaId)}>
                          Detaj
                        </Button>
                        {canWrite && (
                          <>
                            <Button type="button" variant="ghost" onClick={() => void openEdit(o.ofertaId)}>
                              Ndrysho
                            </Button>
                            <Button type="button" variant="danger" onClick={() => void onDelete(o.ofertaId)}>
                              Fshi
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {detail && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Detaj: {detail.emri}</h2>
            <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
              Mbyll
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Zbritja</p>
                <p className="mt-1 text-sm text-slate-900">{detail.perqindjaZbritjes}%</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Statusi</p>
                <p className="mt-1 text-sm text-slate-900">{detail.statusi.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fillimi</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(detail.dataFillimit)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Përfundimi</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(detail.dataPerfundimit)}</p>
              </div>
            </div>

            {detail.pershkrimi && (
              <p className="text-sm text-slate-600">{detail.pershkrimi}</p>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Produktet ({detail.produktet.length})
              </h3>
              {detail.produktet.length === 0 ? (
                <p className="text-sm text-slate-500">Nuk ka produkte të lidhura me këtë ofertë.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {detail.produktet.map((p) => (
                    <li key={p.oferteProduktId} className="px-4 py-2.5 text-sm text-slate-800">
                      {p.produktEmri}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
