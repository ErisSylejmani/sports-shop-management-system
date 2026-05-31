import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, UserCog } from 'lucide-react'
import {
  createAdminRole,
  deleteAdminRole,
  listAdminRoles,
  updateAdminRole,
} from '../api/adminRoles'
import type { AdminRoleDto } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { resolveApiValidationError } from '../lib/errors'

const PROTECTED_ROLES = new Set(['Admin', 'Manager', 'User'])

export function AdminRoletPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AdminRoleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminRoleDto | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAdminRoles()
      setItems(data)
    } catch (err) {
      setError(resolveApiValidationError(err, 'Gabim gjatë leximit të roleve.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setActionError(null)
    setShowForm(true)
  }

  function openEdit(role: AdminRoleDto) {
    setEditing(role)
    setName(role.name)
    setActionError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setName('')
    setActionError(null)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setActionError('Emri i rolit është i detyrueshëm.')
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      if (editing) {
        await updateAdminRole(editing.id, { name: trimmed })
      } else {
        await createAdminRole({ name: trimmed })
      }
      await load()
      closeForm()
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Ruajtja e rolit dështoi.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(role: AdminRoleDto) {
    if (PROTECTED_ROLES.has(role.name)) {
      setActionError(`Roli "${role.name}" nuk mund të fshihet nga UI.`)
      return
    }
    if (!confirm(`Fshi rolin "${role.name}"?`)) return

    setActionError(null)
    try {
      await deleteAdminRole(role.id)
      if (editing?.id === role.id) closeForm()
      await load()
    } catch (err) {
      setActionError(resolveApiValidationError(err, 'Fshirja e rolit dështoi.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Rolet"
        subtitle="Menaxhoni rolet e sistemit (Identity). Vetëm administratorët."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/perdoruesit')}>
              <UserCog className="h-4 w-4" />
              Përdoruesit
            </Button>
            <Button type="button" onClick={openCreate}>
              Shto rol
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
              {editing ? 'Ndrysho rol' : 'Krijo rol'}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={(e) => void onSave(e)}>
              <Input
                label="Emri i rolit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={editing?.name === 'Admin'}
                placeholder="p.sh. User, Manager"
              />
              {editing?.name === 'Admin' && (
                <p className="text-xs text-slate-500">Roli Admin nuk mund të riemërohet.</p>
              )}
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button type="submit" disabled={saving || editing?.name === 'Admin'}>
                  {saving ? 'Duke ruajtur…' : editing ? 'Ruaj ndryshimet' : 'Krijo'}
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
          <h2 className="font-semibold text-slate-800">Lista e roleve</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : items.length === 0 ? (
            <EmptyState message="Nuk ka role të regjistruara." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emri</Th>
                  <Th>ID</Th>
                  <Th className="text-right">Veprime</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((role) => (
                  <Tr key={role.id}>
                    <Td className="font-medium text-slate-900">{role.name}</Td>
                    <Td className="font-mono text-xs text-slate-500">{role.id}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => openEdit(role)}>
                          Ndrysho
                        </Button>
                        <Button
                          variant="danger"
                          disabled={PROTECTED_ROLES.has(role.name)}
                          onClick={() => void onDelete(role)}
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
