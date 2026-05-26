import { useEffect, useState } from 'react'
import { Tags } from 'lucide-react'
import {
  createKategori,
  deleteKategori,
  listKategorite,
  type KategoriPayload,
  updateKategori,
} from '../api/catalog'
import type { KategoriDto } from '../api/types'
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

const initialForm = {
  emri: '',
  pershkrimi: '',
  kategoriaPrindId: '',
}

export function KategoritePage() {
  const { user } = useAuth()
  const canWrite = canWriteCatalog(user?.roles)

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
      setError(resolveApiError(err, 'Gabim gjatë leximit të kategorive.'))
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
      emri: form.emri.trim(),
      pershkrimi: form.pershkrimi.trim() || null,
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
      setActionError(resolveApiError(err, 'Ruajtja e kategorisë dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: KategoriDto) {
    if (!canWrite) return
    if (!confirm(`Fshi kategorinë "${item.emri}"?`)) return

    setActionError(null)
    try {
      await deleteKategori(item.kategoriId)
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja e kategorisë dështoi.'))
    }
  }

  const parentOptions = items.filter((k) => k.kategoriId !== editing?.kategoriId)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tags}
        title="Kategoritë"
        subtitle="Organizoni produktet sipas kategorive dhe nën-kategorive."
        actions={canWrite ? <Button onClick={openCreate}>Shto kategori</Button> : <ReadOnlyBadge />}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {showForm && (
        <Card>
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
              <Textarea
                label="Përshkrimi"
                value={form.pershkrimi}
                onChange={(e) => setForm((f) => ({ ...f, pershkrimi: e.target.value }))}
              />
              <Select
                label="Kategori prind"
                value={form.kategoriaPrindId}
                onChange={(e) => setForm((f) => ({ ...f, kategoriaPrindId: e.target.value }))}
              >
                <option value="">Pa prind</option>
                {parentOptions.map((k) => (
                  <option key={k.kategoriId} value={k.kategoriId}>
                    {k.emri}
                  </option>
                ))}
              </Select>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
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
        <CardBody>
          {loading ? (
            <TableSkeleton rows={4} cols={canWrite ? 4 : 3} />
          ) : items.length === 0 ? (
            <EmptyState
              message={
                canWrite
                  ? 'Nuk ka kategori. Klikoni "Shto kategori" për të filluar.'
                  : 'Nuk ka kategori të regjistruara.'
              }
            />
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
                    <Tr key={k.kategoriId}>
                      <Td className="font-medium text-slate-900">{k.emri}</Td>
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
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
