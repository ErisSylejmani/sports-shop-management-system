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
