import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createPorosiFurnitor,
  deletePorosiFurnitor,
  getPorosiFurnitor,
  listFurnitore,
  listPorosiFurnitore,
  type CreatePorosiPayload,
  type UpdatePorosiPayload,
  updatePorosiFurnitor,
} from '../api/furnitore'
import { listProdukte } from '../api/catalog'
import type { FurnitorDto, PorosiFurnitorDetailDto, PorosiFurnitorSummaryDto, ProduktDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, Td, Th } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateTime } from '../lib/format'

type LineForm = {
  produktId: string
  sasia: string
  cmimiNjesi: string
}

const initialForm = {
  furnitorId: '',
  dataPorosise: '',
  dataPritshme: '',
  statusi: 'Ne_Pritje',
  detajet: [{ produktId: '', sasia: '1', cmimiNjesi: '' }] as LineForm[],
}

function toDateInputValue(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function PorosiFurnitorePage() {
  const { user } = useAuth()
  const canWrite = useMemo(
    () => !!user?.roles?.some((r) => r === 'Admin' || r === 'Manager'),
    [user?.roles],
  )

  const [items, setItems] = useState<PorosiFurnitorSummaryDto[]>([])
  const [detail, setDetail] = useState<PorosiFurnitorDetailDto | null>(null)
  const [furnitore, setFurnitore] = useState<FurnitorDto[]>([])
  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [porosi, f, p] = await Promise.all([listPorosiFurnitore(), listFurnitore(), listProdukte()])
      setItems(porosi)
      setFurnitore(f)
      setProdukte(p)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gabim gjatë leximit të porosive.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function openDetail(id: string) {
    try {
      setDetail(await getPorosiFurnitor(id))
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Leximi i detajit dështoi.')
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(initialForm)
    setActionError(null)
    setShowForm(true)
  }

  async function openEdit(id: string) {
    try {
      const d = await getPorosiFurnitor(id)
      setEditingId(id)
      setForm({
        furnitorId: d.furnitorId,
        dataPorosise: toDateInputValue(d.dataPorosise),
        dataPritshme: toDateInputValue(d.dataPritshme),
        statusi: d.statusi,
        detajet: d.detajet.map((x) => ({
          produktId: x.produktId,
          sasia: String(x.sasia),
          cmimiNjesi: String(x.cmimiNjesi),
        })),
      })
      setActionError(null)
      setShowForm(true)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ngarkimi për edit dështoi.')
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(initialForm)
    setActionError(null)
  }

  function addLine() {
    setForm((f) => ({ ...f, detajet: [...f.detajet, { produktId: '', sasia: '1', cmimiNjesi: '' }] }))
  }

  function removeLine(index: number) {
    setForm((f) => ({
      ...f,
      detajet: f.detajet.filter((_, i) => i !== index),
    }))
  }

  function updateLine(index: number, patch: Partial<LineForm>) {
    setForm((f) => ({
      ...f,
      detajet: f.detajet.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return

    const detajet = form.detajet
      .filter((x) => x.produktId)
      .map((x) => ({
        produktId: x.produktId,
        sasia: Number(x.sasia),
        cmimiNjesi: x.cmimiNjesi === '' ? null : Number(x.cmimiNjesi),
      }))

    if (detajet.length === 0) {
      setActionError('Shto të paktën një rresht produkti.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editingId) {
        const payload: UpdatePorosiPayload = {
          furnitorId: form.furnitorId,
          dataPorosise: form.dataPorosise,
          dataPritshme: form.dataPritshme || null,
          statusi: form.statusi,
          detajet,
        }
        await updatePorosiFurnitor(editingId, payload)
      } else {
        const payload: CreatePorosiPayload = {
          furnitorId: form.furnitorId,
          dataPorosise: form.dataPorosise || null,
          dataPritshme: form.dataPritshme || null,
          statusi: form.statusi,
          detajet,
        }
        await createPorosiFurnitor(payload)
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ruajtja e porosisë dështoi.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!canWrite) return
    if (!confirm('Fshi këtë porosi furnitori?')) return
    try {
      await deletePorosiFurnitor(id)
      if (detail?.porosiId === id) setDetail(null)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Fshirja dështoi.')
    }
  }

  if (!canWrite) {
    return (
      <>
        <PageHeader
          title="Porositë e furnitorëve"
          subtitle="Kjo pjesë është e rezervuar vetëm për Admin/Manager."
        />
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">
              Nuk keni leje për menaxhimin e porosive të furnitorëve.
            </p>
          </CardBody>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Porositë e furnitorëve"
        subtitle="Listë, detaj dhe formë me rreshta dinamikë."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Krijo porosi</Button>
          ) : (
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Vetëm Admin/Manager mund të ndryshojnë
            </span>
          )
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editingId ? 'Ndrysho porosi furnitori' : 'Krijo porosi furnitori'}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={onSave}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-600">Furnitori</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
                    value={form.furnitorId}
                    onChange={(e) => setForm((f) => ({ ...f, furnitorId: e.target.value }))}
                    required
                  >
                    <option value="">Zgjidh furnitor</option>
                    {furnitore.map((f) => (
                      <option key={f.furnitorId} value={f.furnitorId}>
                        {f.emri}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Data porosisë"
                  type="date"
                  value={form.dataPorosise}
                  onChange={(e) => setForm((f) => ({ ...f, dataPorosise: e.target.value }))}
                  required={!!editingId}
                />
                <Input
                  label="Data pritshme"
                  type="date"
                  value={form.dataPritshme}
                  onChange={(e) => setForm((f) => ({ ...f, dataPritshme: e.target.value }))}
                />
              </div>

              <Input
                label="Statusi"
                value={form.statusi}
                onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}
                required
              />

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="font-medium text-slate-800">Rreshtat e porosisë</h3>
                  <Button type="button" variant="ghost" onClick={addLine}>
                    + Shto rresht
                  </Button>
                </CardHeader>
                <CardBody className="space-y-3">
                  {form.detajet.map((line, i) => (
                    <div key={i} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-600">Produkti</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
                          value={line.produktId}
                          onChange={(e) => updateLine(i, { produktId: e.target.value })}
                          required
                        >
                          <option value="">Zgjidh produkt</option>
                          {produkte.map((p) => (
                            <option key={p.produktId} value={p.produktId}>
                              {p.emri}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Sasia"
                        type="number"
                        min="1"
                        value={line.sasia}
                        onChange={(e) => updateLine(i, { sasia: e.target.value })}
                        required
                      />
                      <div className="flex items-end gap-2">
                        <Input
                          label="Cmimi njesi (ops.)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.cmimiNjesi}
                          onChange={(e) => updateLine(i, { cmimiNjesi: e.target.value })}
                        />
                        {form.detajet.length > 1 && (
                          <Button type="button" variant="danger" onClick={() => removeLine(i)}>
                            Hiq
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur...' : editingId ? 'Ruaj ndryshimet' : 'Krijo porosi'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  Anulo
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Lista e porosive</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {actionError && !showForm && <p className="text-sm text-red-600">{actionError}</p>}
            {loading ? (
              <p className="text-sm text-slate-500">Duke ngarkuar porositë...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500">Nuk ka porosi të regjistruara.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Furnitori</Th>
                    <Th>Statusi</Th>
                    <Th className="text-right">Shuma</Th>
                    <Th className="text-right">Veprime</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.porosiId}>
                      <Td>{formatDateTime(p.dataPorosise)}</Td>
                      <Td className="font-medium">{p.furnitorEmri}</Td>
                      <Td>{p.statusi}</Td>
                      <Td className="text-right">{formatCurrency(p.shumaTotale)}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => void openDetail(p.porosiId)}>
                            Detaj
                          </Button>
                          {canWrite && (
                            <>
                              <Button variant="ghost" onClick={() => void openEdit(p.porosiId)}>
                                Ndrysho
                              </Button>
                              <Button variant="danger" onClick={() => void onDelete(p.porosiId)}>
                                Fshi
                              </Button>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Detaji i porosisë</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {!detail ? (
              <p className="text-sm text-slate-500">Zgjidh një porosi nga lista për detaje.</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Furnitori:</span> {detail.furnitorEmri}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Data:</span> {formatDateTime(detail.dataPorosise)}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Statusi:</span> {detail.statusi}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Shuma:</span>{' '}
                  {formatCurrency(detail.shumaTotale)}
                </p>

                <div className="pt-2">
                  <p className="mb-2 text-sm font-semibold text-slate-800">Rreshtat</p>
                  {detail.detajet.length === 0 ? (
                    <p className="text-sm text-slate-500">Nuk ka rreshta.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.detajet.map((d) => (
                        <li key={d.detajPorosiId} className="rounded-lg border border-slate-200 p-2 text-sm">
                          <p className="font-medium text-slate-800">{d.produktEmri}</p>
                          <p className="text-slate-600">
                            Sasia: {d.sasia} · Njësi: {formatCurrency(d.cmimiNjesi)} · Total:{' '}
                            {formatCurrency(d.cmimiTotal)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
