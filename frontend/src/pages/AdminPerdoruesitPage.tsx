import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Shield, UserCog } from 'lucide-react'
import { listAdminRoles } from '../api/adminRoles'
import {
  addAdminUserRole,
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  removeAdminUserRole,
  updateAdminUser,
  type AdminUserListItemDto,
} from '../api/adminUsers'
import type { AdminRoleDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { resolveApiValidationError } from '../lib/errors'
import { formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

const PAGE_SIZE = 20

const initialForm = {
  emri: '',
  mbiemri: '',
  email: '',
  password: '',
  phoneNumber: '',
  eshteAktiv: true,
  roleNames: [] as string[],
}

function listItemFromDetail(detail: Awaited<ReturnType<typeof getAdminUser>>): AdminUserListItemDto {
  return {
    id: detail.id,
    email: detail.email,
    emri: detail.emri,
    mbiemri: detail.mbiemri,
    phoneNumber: detail.phoneNumber,
    eshteAktiv: detail.eshteAktiv,
    dataKrijimit: detail.dataKrijimit,
    roles: [...detail.roles],
  }
}

export function AdminPerdoruesitPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [items, setItems] = useState<AdminUserListItemDto[]>([])
  const [roles, setRoles] = useState<AdminRoleDto[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminUserListItemDto | null>(null)
  const [form, setForm] = useState(initialForm)
  const [roleToAdd, setRoleToAdd] = useState('')
  const [saving, setSaving] = useState(false)
  const [roleSaving, setRoleSaving] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function loadUsers(targetPage = page) {
    setLoading(true)
    setError(null)
    try {
      const data = await listAdminUsers({ page: targetPage, pageSize: PAGE_SIZE })
      setItems(data.items)
      setTotalCount(data.totalCount)
      setPage(data.page)
    } catch (err) {
      setError(resolveApiValidationError(err, 'Gabim gjatë leximit të përdoruesve.'))
    } finally {
      setLoading(false)
    }
  }

  async function loadRoles() {
    try {
      const data = await listAdminRoles()
      setRoles(data)
    } catch {
      /* rolet mbeten bosh */
    }
  }

  useEffect(() => {
    void loadUsers(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rifresko kur ndryshon faqja
  }, [page])

  useEffect(() => {
    void loadRoles()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((u) =>
      [u.email ?? '', u.emri, u.mbiemri, u.phoneNumber ?? '', ...u.roles].some((x) =>
        x.toLowerCase().includes(q),
      ),
    )
  }, [items, query])

  const availableRolesToAdd = useMemo(() => {
    if (!editing) return roles
    return roles.filter((r) => !editing.roles.includes(r.name))
  }, [roles, editing])

  function openCreate() {
    setEditing(null)
    setForm({ ...initialForm, roleNames: roles.some((r) => r.name === 'User') ? ['User'] : [] })
    setRoleToAdd('')
    setActionError(null)
    setShowForm(true)
  }

  function openEdit(item: AdminUserListItemDto) {
    setEditing(item)
    setForm({
      emri: item.emri,
      mbiemri: item.mbiemri,
      email: item.email ?? '',
      password: '',
      phoneNumber: item.phoneNumber ?? '',
      eshteAktiv: item.eshteAktiv,
      roleNames: [...item.roles],
    })
    setRoleToAdd('')
    setActionError(null)
    setShowForm(true)
    setEditLoading(true)
    void getAdminUser(item.id)
      .then((detail) => {
        const refreshed = listItemFromDetail(detail)
        setEditing(refreshed)
        setForm({
          emri: refreshed.emri,
          mbiemri: refreshed.mbiemri,
          email: refreshed.email ?? '',
          password: '',
          phoneNumber: refreshed.phoneNumber ?? '',
          eshteAktiv: refreshed.eshteAktiv,
          roleNames: [...refreshed.roles],
        })
        setItems((prev) => prev.map((u) => (u.id === refreshed.id ? refreshed : u)))
      })
      .catch((err) => {
        setActionError(resolveApiValidationError(err, 'Leximi i detajeve të përdoruesit dështoi.'))
      })
      .finally(() => setEditLoading(false))
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(initialForm)
    setRoleToAdd('')
    setActionError(null)
  }

  function toggleCreateRole(roleName: string) {
    setForm((f) => ({
      ...f,
      roleNames: f.roleNames.includes(roleName)
        ? f.roleNames.filter((r) => r !== roleName)
        : [...f.roleNames, roleName],
    }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()

    if (!form.emri.trim() || !form.mbiemri.trim() || !form.email.trim()) {
      setActionError('Emri, mbiemri dhe email janë të detyrueshëm.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        await updateAdminUser(editing.id, {
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
          eshteAktiv: form.eshteAktiv,
        })
      } else {
        if (!form.password || form.password.length < 6) {
          setActionError('Fjalëkalimi duhet të ketë të paktën 6 karaktere.')
          setSaving(false)
          return
        }
        await createAdminUser({
          emri: form.emri.trim(),
          mbiemri: form.mbiemri.trim(),
          email: form.email.trim(),
          password: form.password,
          phoneNumber: form.phoneNumber.trim() || null,
          eshteAktiv: form.eshteAktiv,
          roleNames: form.roleNames.length > 0 ? form.roleNames : ['User'],
        })
      }
      await loadUsers(page)
      closeForm()
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Ruajtja e përdoruesit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: AdminUserListItemDto) {
    if (item.id === currentUser?.id) {
      setActionError('Nuk mund të fshish llogarinë tënde.')
      return
    }
    if (!confirm(`Fshi përdoruesin "${item.email ?? item.emri}"?`)) return

    setActionError(null)
    try {
      await deleteAdminUser(item.id)
      if (editing?.id === item.id) closeForm()
      await loadUsers(page)
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Fshirja e përdoruesit dështoi.'))
    }
  }

  async function onAddRole() {
    if (!editing || !roleToAdd) return
    setRoleSaving(true)
    setActionError(null)
    try {
      const result = await addAdminUserRole(editing.id, roleToAdd)
      const updated = { ...editing, roles: result.roles }
      setEditing(updated)
      setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setRoleToAdd('')
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Shtimi i rolit dështoi.'))
    } finally {
      setRoleSaving(false)
    }
  }

  async function onRemoveRole(roleName: string) {
    if (!editing) return
    if (
      roleName === 'Admin' &&
      editing.id === currentUser?.id
    ) {
      setActionError('Nuk mund të heqësh rolin Admin nga vetja.')
      return
    }
    if (!confirm(`Hiq rolin "${roleName}" nga ${editing.email ?? editing.emri}?`)) return

    setRoleSaving(true)
    setActionError(null)
    try {
      const result = await removeAdminUserRole(editing.id, roleName)
      const updated = { ...editing, roles: result.roles }
      setEditing(updated)
      setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Heqja e rolit dështoi.'))
    } finally {
      setRoleSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="Përdoruesit"
        subtitle="Menaxhoni llogaritë dhe rolet e përdoruesve. Vetëm administratorët."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/rolet')}>
              <Shield className="h-4 w-4" />
              Rolet
            </Button>
            <Button type="button" onClick={openCreate}>
              Shto përdorues
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && !showForm && <Alert variant="error">{actionError}</Alert>}

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              {editing ? 'Ndrysho përdorues' : 'Krijo përdorues'}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={(e) => void onSave(e)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Emri"
                  required
                  value={form.emri}
                  onChange={(e) => setForm((f) => ({ ...f, emri: e.target.value }))}
                />
                <Input
                  label="Mbiemri"
                  required
                  value={form.mbiemri}
                  onChange={(e) => setForm((f) => ({ ...f, mbiemri: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <Input
                  label="Telefoni"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
                {!editing && (
                  <Input
                    label="Fjalëkalimi"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                )}
                <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.eshteAktiv}
                    onChange={(e) => setForm((f) => ({ ...f, eshteAktiv: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Llogaria aktive
                </label>
              </div>

              {!editing && roles.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">Rolet fillestare</p>
                  <div className="flex flex-wrap gap-3">
                    {roles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.roleNames.includes(r.name)}
                          onChange={() => toggleCreateRole(r.name)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {r.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {editing && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-600">Rolet aktuale</p>
                  {editLoading ? (
                    <p className="mt-2 text-sm text-slate-500">Duke ngarkuar rolet…</p>
                  ) : (
                    <>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {editing.roles.length === 0 ? (
                          <span className="text-sm text-slate-500">Pa role</span>
                        ) : (
                          editing.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                            >
                              {role}
                              <button
                                type="button"
                                className="ml-0.5 text-slate-500 hover:text-red-600"
                                disabled={roleSaving}
                                onClick={() => void onRemoveRole(role)}
                                aria-label={`Hiq rolin ${role}`}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      {availableRolesToAdd.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-end gap-2">
                          <Select
                            label="Shto rol"
                            value={roleToAdd}
                            onChange={(e) => setRoleToAdd(e.target.value)}
                            className="min-w-[160px]"
                            disabled={roleSaving}
                          >
                            <option value="">— Zgjidh —</option>
                            {availableRolesToAdd.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={!roleToAdd || roleSaving}
                            onClick={() => void onAddRole()}
                          >
                            {roleSaving ? 'Duke shtuar…' : 'Shto'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur…' : editing ? 'Ruaj ndryshimet' : 'Krijo përdoruesin'}
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
        <CardBody className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Input
            label="Kërkim lokal (faqja aktuale)"
            placeholder="Email, emër, rol…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
          <div className="flex items-end gap-2 pb-1">
            <Button
              type="button"
              variant="ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Para
            </Button>
            <span className="text-sm text-slate-600">
              Faqja {page} / {totalPages} ({totalCount} total)
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Tjetra →
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Lista e përdoruesve</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Nuk ka përdorues për filtrat aktual." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Emri</Th>
                  <Th>Telefoni</Th>
                  <Th>Rolet</Th>
                  <Th>Statusi</Th>
                  <Th>Regjistruar</Th>
                  <Th className="text-right">Veprime</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium text-slate-900">{u.email ?? '—'}</Td>
                    <Td>
                      {u.emri} {u.mbiemri}
                    </Td>
                    <Td>{u.phoneNumber ?? '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          u.eshteAktiv
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {u.eshteAktiv ? 'Aktiv' : 'Joaktiv'}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      {formatDateTime(u.dataKrijimit)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => openEdit(u)}>
                          Ndrysho
                        </Button>
                        <Button
                          variant="danger"
                          disabled={u.id === currentUser?.id}
                          onClick={() => void onDelete(u)}
                        >
                          Fshi
                        </Button>
                      </div>
                    </Td>
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
