import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createFurnitor,
  deleteFurnitor,
  listFurnitore,
  type FurnitorPayload,
  updateFurnitor,
} from '../api/furnitore'
import type { FurnitorDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Table, Td, Th } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  emri: '',
  personiKontaktit: '',
  telefoni: '',
  email: '',
  adresa: '',
  qyteti: '',
  shteti: '',
}

export function FurnitorePage() {
  const { user } = useAuth()
  const canWrite = useMemo(
    () => !!user?.roles?.some((r) => r === 'Admin' || r === 'Manager'),
    [user?.roles],
  )

  const [items, setItems] = useState<FurnitorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FurnitorDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await listFurnitore())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gabim gjatë leximit të furnitorëve.')
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

  function openEdit(item: FurnitorDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      personiKontaktit: item.personiKontaktit ?? '',
      telefoni: item.telefoni ?? '',
      email: item.email ?? '',
      adresa: item.adresa ?? '',
      qyteti: item.qyteti ?? '',
      shteti: item.shteti ?? '',
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

    const payload: FurnitorPayload = {
      emri: form.emri,
      personiKontaktit: form.personiKontaktit || null,
      telefoni: form.telefoni || null,
      email: form.email || null,
      adresa: form.adresa || null,
      qyteti: form.qyteti || null,
      shteti: form.shteti || null,
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        await updateFurnitor(editing.furnitorId, payload)
      } else {
        await createFurnitor(payload)
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ruajtja dështoi.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: FurnitorDto) {
    if (!canWrite) return
    if (!confirm(`Fshi furnitorin "${item.emri}"?`)) return
    try {
      await deleteFurnitor(item.furnitorId)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Fshirja dështoi.')
    }
  }

  if (!canWrite) {
    return (
      <>
        <PageHeader
          title="Furnitorët"
          subtitle="Kjo pjesë është e rezervuar vetëm për Admin/Manager."
        />
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">Nuk keni leje për menaxhimin e furnitorëve.</p>
          </CardBody>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Furnitorët"
        subtitle="Menaxho furnitorët e dyqanit."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Shto furnitor</Button>
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
              {editing ? 'Ndrysho furnitor' : 'Krijo furnitor'}
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
                label="Personi i kontaktit"
                value={form.personiKontaktit}
                onChange={(e) => setForm((f) => ({ ...f, personiKontaktit: e.target.value }))}
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
                label="Qyteti"
                value={form.qyteti}
                onChange={(e) => setForm((f) => ({ ...f, qyteti: e.target.value }))}
              />
              <Input
                label="Shteti"
                value={form.shteti}
                onChange={(e) => setForm((f) => ({ ...f, shteti: e.target.value }))}
              />
              <div className="md:col-span-2">
                <Input
                  label="Adresa"
                  value={form.adresa}
                  onChange={(e) => setForm((f) => ({ ...f, adresa: e.target.value }))}
                />
              </div>
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
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Lista e furnitorëve</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {actionError && !showForm && <p className="text-sm text-red-600">{actionError}</p>}
          {loading ? (
            <p className="text-sm text-slate-500">Duke ngarkuar furnitorët...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Nuk ka furnitorë të regjistruar.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th>Kontakt</Th>
                  <Th>Telefoni</Th>
                  <Th>Email</Th>
                  <Th>Qyteti</Th>
                  {canWrite && <Th className="text-right">Veprime</Th>}
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.furnitorId}>
                    <Td className="font-medium">{f.emri}</Td>
                    <Td>{f.personiKontaktit || '—'}</Td>
                    <Td>{f.telefoni || '—'}</Td>
                    <Td>{f.email || '—'}</Td>
                    <Td>{f.qyteti || '—'}</Td>
                    {canWrite && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => openEdit(f)}>
                            Ndrysho
                          </Button>
                          <Button variant="danger" onClick={() => onDelete(f)}>
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
