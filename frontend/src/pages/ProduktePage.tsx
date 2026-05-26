import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search } from 'lucide-react'
import {
  createProdukt,
  deleteProdukt,
  listKategorite,
  listProdukte,
  type ProduktPayload,
  updateProdukt,
} from '../api/catalog'
import type { KategoriDto, ProduktDto } from '../api/types'
import { canWriteCatalog } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { ReadOnlyBadge } from '../components/layout/ReadOnlyBadge'
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
import { formatCurrency } from '../lib/format'

const initialForm = {
  emri: '',
  pershkrimi: '',
  kategoriId: '',
  marka: '',
  cmimiBlerjes: '0',
  cmimiShitjes: '0',
  sasiaStok: '0',
  madhesia: '',
  ngjyra: '',
}

export function ProduktePage() {
  const { user } = useAuth()
  const canWrite = canWriteCatalog(user?.roles)

  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [kategorite, setKategorite] = useState<KategoriDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProduktDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, k] = await Promise.all([
        listProdukte(kategoriFilter || undefined),
        listKategorite(),
      ])
      setProdukte(p)
      setKategorite(k)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të produkteve.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [kategoriFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return produkte
    return produkte.filter((p) =>
      [p.emri, p.marka, p.kategoriEmri].some((x) => x.toLowerCase().includes(q)),
    )
  }, [produkte, query])

  function openCreate() {
    setEditing(null)
    setForm({
      ...initialForm,
      kategoriId: kategoriFilter || '',
    })
    setActionError(null)
    setShowForm(true)
  }

  function openEdit(item: ProduktDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      pershkrimi: item.pershkrimi ?? '',
      kategoriId: item.kategoriId,
      marka: item.marka,
      cmimiBlerjes: String(item.cmimiBlerjes),
      cmimiShitjes: String(item.cmimiShitjes),
      sasiaStok: String(item.sasiaStok),
      madhesia: item.madhesia ?? '',
      ngjyra: item.ngjyra ?? '',
    })
    setActionError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(initialForm)
    setActionError(null)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canWrite) return

    const cmimiBlerjes = Number(form.cmimiBlerjes)
    const cmimiShitjes = Number(form.cmimiShitjes)
    const sasiaStok = Number(form.sasiaStok)

    if (!form.kategoriId) {
      setActionError('Zgjidhni një kategori.')
      return
    }
    if (Number.isNaN(cmimiBlerjes) || Number.isNaN(cmimiShitjes) || Number.isNaN(sasiaStok)) {
      setActionError('Çmimet dhe stoku duhet të jenë numra të vlefshëm.')
      return
    }

    const payload: ProduktPayload = {
      emri: form.emri.trim(),
      pershkrimi: form.pershkrimi.trim() || null,
      kategoriId: form.kategoriId,
      marka: form.marka.trim(),
      cmimiBlerjes,
      cmimiShitjes,
      sasiaStok,
      madhesia: form.madhesia.trim() || null,
      ngjyra: form.ngjyra.trim() || null,
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        await updateProdukt(editing.produktId, payload)
      } else {
        await createProdukt(payload)
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(resolveApiError(err, 'Ruajtja e produktit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: ProduktDto) {
    if (!canWrite) return
    if (!confirm(`Fshi produktin "${item.emri}"?`)) return

    setActionError(null)
    try {
      await deleteProdukt(item.produktId)
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja e produktit dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title="Produktet"
        subtitle="Katalogu i inventarit — çmime, stok dhe kategori."
        actions={
          canWrite ? (
            <Button onClick={openCreate} disabled={kategorite.length === 0}>
              Shto produkt
            </Button>
          ) : (
            <ReadOnlyBadge />
          )
        }
      />

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {kategorite.length === 0 && !loading && canWrite && (
        <Alert variant="warning">
          Së pari{' '}
          <Link to="/kategorite" className="font-semibold underline hover:no-underline">
            krijoni një kategori
          </Link>{' '}
          për të shtuar produkte.
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editing ? 'Ndrysho produkt' : 'Krijo produkt'}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
              <Input
                label="Emri"
                value={form.emri}
                onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))}
                required
              />
              <Input
                label="Marka"
                value={form.marka}
                onChange={(e) => setForm((f) => ({ ...f, marka: e.target.value }))}
                required
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Përshkrimi"
                  value={form.pershkrimi}
                  onChange={(e) => setForm((f) => ({ ...f, pershkrimi: e.target.value }))}
                />
              </div>

              <Select
                label="Kategoria"
                value={form.kategoriId}
                onChange={(e) => setForm((f) => ({ ...f, kategoriId: e.target.value }))}
                required
              >
                <option value="">Zgjidh kategori</option>
                {kategorite.map((k) => (
                  <option key={k.kategoriId} value={k.kategoriId}>
                    {k.emri}
                  </option>
                ))}
              </Select>

              <Input
                label="Çmimi blerjes"
                type="number"
                step="0.01"
                min="0"
                value={form.cmimiBlerjes}
                onChange={(e) => setForm((f) => ({ ...f, cmimiBlerjes: e.target.value }))}
                required
              />

              <Input
                label="Çmimi shitjes"
                type="number"
                step="0.01"
                min="0"
                value={form.cmimiShitjes}
                onChange={(e) => setForm((f) => ({ ...f, cmimiShitjes: e.target.value }))}
                required
              />

              <Input
                label="Sasia stok"
                type="number"
                min="0"
                value={form.sasiaStok}
                onChange={(e) => setForm((f) => ({ ...f, sasiaStok: e.target.value }))}
                required
              />

              <Input
                label="Madhësia"
                value={form.madhesia}
                onChange={(e) => setForm((f) => ({ ...f, madhesia: e.target.value }))}
              />

              <Input
                label="Ngjyra"
                value={form.ngjyra}
                onChange={(e) => setForm((f) => ({ ...f, ngjyra: e.target.value }))}
              />

              {actionError && (
                <p className="text-sm text-red-600 md:col-span-2">{actionError}</p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur...' : editing ? 'Ruaj ndryshimet' : 'Krijo'}
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
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-semibold text-slate-800">Lista e produkteve</h2>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[28rem]">
            <Select
              label="Filtro kategori"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
            >
              <option value="">Të gjitha kategoritë</option>
              {kategorite.map((k) => (
                <option key={k.kategoriId} value={k.kategoriId}>
                  {k.emri}
                </option>
              ))}
            </Select>
            <Input
              label="Kërko"
              placeholder="Emër, markë, kategori..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={6} cols={canWrite ? 6 : 5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                query || kategoriFilter
                  ? 'Nuk ka rezultate për filtrin aktual.'
                  : canWrite
                    ? 'Nuk ka produkte. Klikoni "Shto produkt" për të filluar.'
                    : 'Nuk ka produkte të regjistruara.'
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th>Marka</Th>
                  <Th>Kategoria</Th>
                  <Th className="text-right">Çmimi shitjes</Th>
                  <Th className="text-right">Stok</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <Tr key={p.produktId}>
                    <Td className="font-medium text-slate-900">{p.emri}</Td>
                    <Td>{p.marka}</Td>
                    <Td>{p.kategoriEmri}</Td>
                    <Td className="text-right font-medium">{formatCurrency(p.cmimiShitjes)}</Td>
                    <Td className="text-right">{p.sasiaStok}</Td>
                    {canWrite && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => openEdit(p)}>
                            Ndrysho
                          </Button>
                          <Button variant="danger" onClick={() => onDelete(p)}>
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
