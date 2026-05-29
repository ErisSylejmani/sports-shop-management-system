import { apiFetch } from './client'
import type { KthimDto } from './types'

export type ListKthimetParams = {
  shitjeId?: string
  produktId?: string
}

export type CreateKthimPayload = {
  shitjeId: string
  produktId: string
  sasia: number
  arsyeja: string
  statusi: string
  dataKthimit?: string | null
}

export type UpdateKthimPayload = {
  sasia: number
  arsyeja: string
  dataKthimit: string
  statusi: string
}

export function listKthimet(params?: ListKthimetParams) {
  const qs = new URLSearchParams()
  if (params?.shitjeId) qs.set('shitjeId', params.shitjeId)
  if (params?.produktId) qs.set('produktId', params.produktId)
  const query = qs.toString()
  return apiFetch<KthimDto[]>(`/api/kthimet${query ? `?${query}` : ''}`)
}

export function getKthim(id: string) {
  return apiFetch<KthimDto>(`/api/kthimet/${id}`)
}

export function createKthim(body: CreateKthimPayload) {
  return apiFetch<KthimDto>('/api/kthimet', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateKthim(id: string, body: UpdateKthimPayload) {
  return apiFetch<KthimDto>(`/api/kthimet/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteKthim(id: string) {
  return apiFetch<void>(`/api/kthimet/${id}`, { method: 'DELETE' })
}
