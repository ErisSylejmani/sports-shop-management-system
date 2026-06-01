import { apiFetch } from './client'
import type {
  AdminUserDetailDto,
  AdminUserListItemDto,
  AdminUserRolesResponse,
  AdminUsersListResponse,
} from './types'

export type ListAdminUsersParams = {
  page?: number
  pageSize?: number
}

export type CreateAdminUserPayload = {
  emri: string
  mbiemri: string
  email: string
  password: string
  phoneNumber?: string | null
  eshteAktiv?: boolean
  roleNames?: string[]
}

export type UpdateAdminUserPayload = {
  emri: string
  mbiemri: string
  email: string
  phoneNumber?: string | null
  eshteAktiv: boolean
}

export type AdminUserRolePayload = {
  roleName: string
}


export function listAdminUsers(params?: ListAdminUsersParams) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const query = qs.toString()
  return apiFetch<AdminUsersListResponse>(`/api/admin/users${query ? `?${query}` : ''}`)
}


export function getAdminUser(id: string) {
  return apiFetch<AdminUserDetailDto>(`/api/admin/users/${id}`)
}


export function createAdminUser(body: CreateAdminUserPayload) {
  return apiFetch<AdminUserDetailDto>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


export function updateAdminUser(id: string, body: UpdateAdminUserPayload) {
  return apiFetch<AdminUserDetailDto>(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}


export function deleteAdminUser(id: string) {
  return apiFetch<void>(`/api/admin/users/${id}`, { method: 'DELETE' })
}


export function addAdminUserRole(id: string, roleName: string) {
  const body: AdminUserRolePayload = { roleName }
  return apiFetch<AdminUserRolesResponse>(`/api/admin/users/${id}/roles`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


export function removeAdminUserRole(id: string, roleName: string) {
  return apiFetch<AdminUserRolesResponse>(
    `/api/admin/users/${id}/roles/${encodeURIComponent(roleName)}`,
    { method: 'DELETE' },
  )
}

export type { AdminUserListItemDto }
