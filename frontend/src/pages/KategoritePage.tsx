import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createKategori,
  deleteKategori,
  listKategorite,
  type KategoriPayload,
  updateKategori,
} from '../api/catalog'
import type { KategoriDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, Td, Th } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  emri: '',
  pershkrimi: '',
  kategoriaPrindId: '',
}

export function KategoritePage() {
  const { user } = useAuth()
  const canWrite = useMemo(
    () => !!user?.roles?.some((r) => r === 'Admin' || r === 'Manager'),
    [user?.roles],
  )

  const [items, setItems] = useState<KategoriDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KategoriDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listKategorite()
      setItems(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gabim gjatë leximit të kategorive.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setActionError(null)
    setShowForm(true)
  }

  function openEdit(item: KategoriDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      pershkrimi: item.pershkrimi ?? '',
      kategoriaPrindId: item.kategoriaPrindId ?? '',
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

    const payload: KategoriPayload = {
      emri: form.emri,
      pershkrimi: form.pershkrimi || null,
      kategoriaPrindId: form.kategoriaPrindId || null,
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        await updateKategori(editing.kategoriId, payload)
      } else {
        await createKategori(payload)
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ruajtja dështoi.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: KategoriDto) {
    if (!canWrite) return
    if (!confirm(`Fshi kategorinë "${item.emri}"?`)) return

    try {
      await deleteKategori(item.kategoriId)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Fshirja dështoi.')
    }
  }

  const parentOptions = items.filter((k) => k.kategoriId !== editing?.kategoriId)

  return (
    <>
      <PageHeader
        title="Kategoritë"
        subtitle="Menaxho kategoritë e produkteve."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Shto kategori</Button>
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
              {editing ? 'Ndrysho kategori' : 'Krijo kategori'}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={onSave}>
              <Input
                label="Emri"
                value={form.emri}
                onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Përshkrimi</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
                  rows={3}
                  value={form.pershkrimi}
                  onChange={(e) => setForm((f) => ({ ...f, pershkrimi: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Kategori prind</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30"
                  value={form.kategoriaPrindId}
                  onChange={(e) => setForm((f) => ({ ...f, kategoriaPrindId: e.target.value }))}
                >
                  <option value="">Pa prind</option>
                  {parentOptions.map((k) => (
                    <option key={k.kategoriId} value={k.kategoriId}>
                      {k.emri}
                    </option>
                  ))}
                </select>
              </div>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="flex flex-wrap gap-2">
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
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Lista e kategorive</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {actionError && !showForm && <p className="text-sm text-red-600">{actionError}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Duke ngarkuar kategoritë...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Nuk ka kategori të regjistruara.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th>Përshkrimi</Th>
                  <Th>Prindi</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {items.map((k) => {
                  const prind = items.find((x) => x.kategoriId === k.kategoriaPrindId)
                  return (
                    <tr key={k.kategoriId}>
                      <Td className="font-medium">{k.emri}</Td>
                      <Td>{k.pershkrimi || '—'}</Td>
                      <Td>{prind?.emri || '—'}</Td>
                      {canWrite && (
                        <Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => openEdit(k)}>
                              Ndrysho
                            </Button>
                            <Button variant="danger" onClick={() => onDelete(k)}>
                              Fshi
                            </Button>
                          </div>
                        </Td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  )
}
