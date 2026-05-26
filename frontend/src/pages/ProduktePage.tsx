import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createProdukt,
  deleteProdukt,
  listKategorite,
  listProdukte,
  type ProduktPayload,
  updateProdukt,
} from '../api/catalog'
import type { KategoriDto, ProduktDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, Td, Th } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'

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

function toMoney(value: number) {
  return `${value.toLocaleString('sq-AL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function ProduktePage() {
  const { user } = useAuth()
  const canWrite = useMemo(
    () => !!user?.roles?.some((r) => r === 'Admin' || r === 'Manager'),
    [user?.roles],
  )

  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [kategorite, setKategorite] = useState<KategoriDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProduktDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, k] = await Promise.all([listProdukte(), listKategorite()])
      setProdukte(p)
      setKategorite(k)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gabim gjatë leximit të produkteve.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return produkte
    return produkte.filter((p) =>
      [p.emri, p.marka, p.kategoriEmri].some((x) => x.toLowerCase().includes(q)),
    )
  }, [produkte, query])

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
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

    const payload: ProduktPayload = {
      emri: form.emri,
      pershkrimi: form.pershkrimi || null,
      kategoriId: form.kategoriId,
      marka: form.marka,
      cmimiBlerjes: Number(form.cmimiBlerjes),
      cmimiShitjes: Number(form.cmimiShitjes),
      sasiaStok: Number(form.sasiaStok),
      madhesia: form.madhesia || null,
      ngjyra: form.ngjyra || null,
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
      setActionError(err instanceof ApiError ? err.message : 'Ruajtja dështoi.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: ProduktDto) {
    if (!canWrite) return
    if (!confirm(`Fshi produktin "${item.emri}"?`)) return

    try {
      await deleteProdukt(item.produktId)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Fshirja dështoi.')
    }
  }

  return (
    <>
      <PageHeader
        title="Produktet"
        subtitle="Katalogu i produkteve me filtrim lokal."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Shto produkt</Button>
          ) : (
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Stafi ka vetëm lexim
            </span>
          )
        }
      />

      {showForm && (
        <Card className="mb-6">
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

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-slate-600">Përshkrimi</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
                  rows={3}
                  value={form.pershkrimi}
                  onChange={(e) => setForm((f) => ({ ...f, pershkrimi: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Kategoria</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
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
                </select>
              </div>

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

              {actionError && <p className="text-sm text-red-600 md:col-span-2">{actionError}</p>}

              <div className="flex flex-wrap gap-2 md:col-span-2">
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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold text-slate-800">Lista e produkteve</h2>
          <div className="w-full md:w-80">
            <Input
              placeholder="Filtro sipas emrit, markës ose kategorisë..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {actionError && !showForm && <p className="text-sm text-red-600">{actionError}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Duke ngarkuar produktet...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">
              {query ? 'Nuk ka rezultate për filtrin aktual.' : 'Nuk ka produkte të regjistruara.'}
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th>Marka</Th>
                  <Th>Kategoria</Th>
                  <Th className="text-right">Çmimi</Th>
                  <Th className="text-right">Stok</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.produktId}>
                    <Td className="font-medium">{p.emri}</Td>
                    <Td>{p.marka}</Td>
                    <Td>{p.kategoriEmri}</Td>
                    <Td className="text-right">{toMoney(p.cmimiShitjes)}</Td>
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
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  )
}
