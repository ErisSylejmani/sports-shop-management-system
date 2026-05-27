import { useEffect, useMemo, useState } from 'react'
import { Search, UserRoundCog } from 'lucide-react'
import {
  createPunetor,
  deletePunetor,
  listPunetoret,
  type CreatePunetorPayload,
  type UpdatePunetorPayload,
  updatePunetor,
} from '../api/punetoret'
import type { PunetorDto } from '../api/types'
import { canWriteManagement } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { ReadOnlyBadge } from '../components/layout/ReadOnlyBadge'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatCurrency, formatDateTime } from '../lib/format'

const initialForm = {
  emri: '',
  mbiemri: '',
  pozita: '',
  telefoni: '',
  email: '',
  password: '',
  dataPunesimit: '',
  paga: '0',
}

export function PunetoretPage() {
  const { user } = useAuth()
  const canWrite = canWriteManagement(user?.roles)

  const [items, setItems] = useState<PunetorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PunetorDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listPunetoret()
      setItems(data)
    } catch (err) {
      setError(resolveApiError(err, 'Gabim gjatë leximit të punëtorëve.'))
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
    return items.filter((p) =>
      [p.emri, p.mbiemri, p.pozita, p.email ?? '', p.telefoni ?? ''].some((x) =>
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

  function openEdit(item: PunetorDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      mbiemri: item.mbiemri,
      pozita: item.pozita,
      telefoni: item.telefoni ?? '',
      email: item.email ?? '',
      password: '',
      dataPunesimit: new Date(item.dataPunesimit).toISOString().slice(0, 10),
      paga: String(item.paga),
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

    const paga = Number(form.paga)
    if (Number.isNaN(paga) || paga < 0) {
      setActionError('Paga duhet të jetë numër jo negativ.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        const payload: UpdatePunetorPayload = {
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          pozita: form.pozita.trim(),
          telefoni: form.telefoni.trim() || null,
          email: form.email.trim() || null,
          dataPunesimit: form.dataPunesimit || new Date().toISOString(),
          paga,
        }
        await updatePunetor(editing.punetorId, payload)
      } else {
        if (!form.email.trim() || !form.password.trim()) {
          setActionError('Email dhe password janë të detyrueshme për krijim.')
          setSaving(false)
          return
        }

        const payload: CreatePunetorPayload = {
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          pozita: form.pozita.trim(),
          telefoni: form.telefoni.trim() || null,
          email: form.email.trim(),
          password: form.password,
          dataPunesimit: form.dataPunesimit || null,
          paga,
        }
        await createPunetor(payload)
      }

      await load()
      closeForm()
    } catch (err) {
      setActionError(resolveApiError(err, 'Ruajtja e punëtorit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: PunetorDto) {
    if (!canWrite) return
    if (!confirm(`Fshi punëtorin "${item.emri} ${item.mbiemri}"?`)) return

    setActionError(null)
    try {
      await deletePunetor(item.punetorId)
      await load()
    } catch (err) {
      setActionError(resolveApiError(err, 'Fshirja e punëtorit dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRoundCog}
        title="Punëtorët"
        subtitle="Menaxhimi i stafit dhe lidhja me llogaritë e login-it."
        actions={canWrite ? <Button onClick={openCreate}>Shto punëtor</Button> : <ReadOnlyBadge />}
      />

      <Alert variant="info" className="mb-0">
        Krijon punëtor + llogari staf (User)
      </Alert>

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editing ? 'Ndrysho punëtor' : 'Krijo punëtor + login'}
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
                label="Pozita"
                value={form.pozita}
                onChange={(e) => setForm((f) => ({ ...f, pozita: e.target.value }))}
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
                required={!editing}
              />
              {!editing && (
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              )}
              <Input
                label="Data punësimit"
                type="date"
                value={form.dataPunesimit}
                onChange={(e) => setForm((f) => ({ ...f, dataPunesimit: e.target.value }))}
              />
              <Input
                label="Paga"
                type="number"
                min="0"
                step="0.01"
                value={form.paga}
                onChange={(e) => setForm((f) => ({ ...f, paga: e.target.value }))}
                required
              />
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
          <h2 className="font-semibold text-slate-800">Lista e punëtorëve</h2>
          <div className="w-full lg:w-80">
            <Input
              label="Kërko"
              placeholder="Emër, mbiemër, pozita, email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={6} cols={canWrite ? 8 : 7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                query
                  ? 'Nuk ka rezultate për filtrin aktual.'
                  : canWrite
                    ? 'Nuk ka punëtorë. Klikoni "Shto punëtor" për të filluar.'
                    : 'Nuk ka punëtorë të regjistruar.'
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Punëtori</Th>
                  <Th>Pozita</Th>
                  <Th>Email</Th>
                  <Th>Telefoni</Th>
                  <Th>UserId</Th>
                  <Th>Data punësimit</Th>
                  <Th className="text-right">Paga</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <Tr key={p.punetorId}>
                    <Td className="font-medium text-slate-900">
                      {p.emri} {p.mbiemri}
                    </Td>
                    <Td>{p.pozita}</Td>
                    <Td>{p.email || '—'}</Td>
                    <Td>{p.telefoni || '—'}</Td>
                    <Td className="font-mono text-xs">{p.userId || '—'}</Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      {formatDateTime(p.dataPunesimit)}
                    </Td>
                    <Td className="text-right font-medium">{formatCurrency(p.paga)}</Td>
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
