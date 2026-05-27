import { useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import {
  createKlient,
  deleteKlient,
  listKlientet,
  type CreateKlientPayload,
  type UpdateKlientPayload,
  updateKlient,
} from '../api/klientet'
import { canWriteKlientet } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { ReadOnlyBadge } from '../components/layout/ReadOnlyBadge'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatDateTime } from '../lib/format'
import type { KlientDto } from '../api/types'

const initialForm = {
  emri: '',
  mbiemri: '',
  telefoni: '',
  email: '',
  adresa: '',
  dataRegjistrimit: '',
  piketBesnikerise: '0',
}

export function KlientetPage() {
  const { user } = useAuth()
  const canWrite = canWriteKlientet(user?.roles)

  const [items, setItems] = useState<KlientDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KlientDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listKlientet()
      setItems(data)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të klientëve.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((k) =>
      [k.emri, k.mbiemri, k.email ?? '', k.telefoni ?? ''].some((x) =>
        x.toLowerCase().includes(q),
      ),
    )
  }, [items, query])

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setActionError(null)
    setShowForm(true)
  }

  function openEdit(item: KlientDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      mbiemri: item.mbiemri,
      telefoni: item.telefoni ?? '',
      email: item.email ?? '',
      adresa: item.adresa ?? '',
      dataRegjistrimit: '',
      piketBesnikerise: String(item.piketBesnikerise),
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

    const piket = Number(form.piketBesnikerise)
    if (Number.isNaN(piket) || piket < 0) {
      setActionError('Pikët e besnikërisë duhet të jenë numër jo negativ.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        const payload: UpdateKlientPayload = {
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          telefoni: form.telefoni.trim() || null,
          email: form.email.trim() || null,
          adresa: form.adresa.trim() || null,
          piketBesnikerise: piket,
        }
        await updateKlient(editing.klientId, payload)
      } else {
        const payload: CreateKlientPayload = {
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          telefoni: form.telefoni.trim() || null,
          email: form.email.trim() || null,
          adresa: form.adresa.trim() || null,
          dataRegjistrimit: form.dataRegjistrimit || null,
          piketBesnikerise: piket,
        }
        await createKlient(payload)
      }

      await load()
      closeForm()
    } catch (err) {
      setActionError(resolveApiError(err, 'Ruajtja e klientit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: KlientDto) {
    if (!canWrite) return
    if (!confirm(`Fshi klientin "${item.emri} ${item.mbiemri}"?`)) return

    setActionError(null)
    try {
      await deleteKlient(item.klientId)
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja e klientit dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Klientët"
        subtitle="Menaxhimi i klientëve dhe pikëve të besnikërisë."
        actions={canWrite ? <Button onClick={openCreate}>Shto klient</Button> : <ReadOnlyBadge />}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editing ? 'Ndrysho klient' : 'Krijo klient'}
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
                label="Mbiemri"
                value={form.mbiemri}
                onChange={(e) => setForm((f) => ({ ...f, mbiemri: e.target.value }))}
                required
              />
              <Input
                label="Telefoni"
                value={form.telefoni}
                onChange={(e) => setForm((f) => ({ ...f, telefoni: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Pikët e besnikërisë"
                type="number"
                min="0"
                value={form.piketBesnikerise}
                onChange={(e) => setForm((f) => ({ ...f, piketBesnikerise: e.target.value }))}
              />
              {!editing && (
                <Input
                  label="Data regjistrimit (opsionale)"
                  type="datetime-local"
                  value={form.dataRegjistrimit}
                  onChange={(e) => setForm((f) => ({ ...f, dataRegjistrimit: e.target.value }))}
                />
              )}
              <div className="md:col-span-2">
                <Textarea
                  label="Adresa"
                  value={form.adresa}
                  onChange={(e) => setForm((f) => ({ ...f, adresa: e.target.value }))}
                />
              </div>
              {actionError && <p className="text-sm text-red-600 md:col-span-2">{actionError}</p>}
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
          <h2 className="font-semibold text-slate-800">Lista e klientëve</h2>
          <div className="w-full lg:w-80">
            <Input
              label="Kërko"
              placeholder="Emër, mbiemër, email, telefon..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={6} cols={canWrite ? 7 : 6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                query
                  ? 'Nuk ka rezultate për filtrin aktual.'
                  : canWrite
                    ? 'Nuk ka klientë. Klikoni "Shto klient" për të filluar.'
                    : 'Nuk ka klientë të regjistruar.'
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Klienti</Th>
                  <Th>Email</Th>
                  <Th>Telefoni</Th>
                  <Th>Pikë</Th>
                  <Th>Data regjistrimit</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <Tr key={k.klientId}>
                    <Td className="font-medium text-slate-900">
                      {k.emri} {k.mbiemri}
                    </Td>
                    <Td>{k.email || '—'}</Td>
                    <Td>{k.telefoni || '—'}</Td>
                    <Td>{k.piketBesnikerise}</Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      {formatDateTime(k.dataRegjistrimit)}
                    </Td>
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
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
