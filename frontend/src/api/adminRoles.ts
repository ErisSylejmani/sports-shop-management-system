import { apiFetch } from './client'
import type { AdminRoleDto } from './types'

export type AdminRolePayload = {
  name: string
}

/** GET /api/admin/roles */
export function listAdminRoles() {
  return apiFetch<AdminRoleDto[]>('/api/admin/roles')
}

/** POST /api/admin/roles */
export function createAdminRole(body: AdminRolePayload) {
  return apiFetch<AdminRoleDto>('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PUT /api/admin/roles/:id */
export function updateAdminRole(id: string, body: AdminRolePayload) {
  return apiFetch<AdminRoleDto>(`/api/admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** DELETE /api/admin/roles/:id */
export function deleteAdminRole(id: string) {
  return apiFetch<void>(`/api/admin/roles/${id}`, { method: 'DELETE' })
}
