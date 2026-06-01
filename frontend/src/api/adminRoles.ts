import { apiFetch } from './client'
import type { AdminRoleDto } from './types'

export type AdminRolePayload = {
  name: string
}


export function listAdminRoles() {
  return apiFetch<AdminRoleDto[]>('/api/admin/roles')
}


export function createAdminRole(body: AdminRolePayload) {
  return apiFetch<AdminRoleDto>('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


export function updateAdminRole(id: string, body: AdminRolePayload) {
  return apiFetch<AdminRoleDto>(`/api/admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}


export function deleteAdminRole(id: string) {
  return apiFetch<void>(`/api/admin/roles/${id}`, { method: 'DELETE' })
}
