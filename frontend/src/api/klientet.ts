import { apiFetch } from './client'
import type { KlientDto } from './types'

export type CreateKlientPayload = {
  emri: string
  mbiemri: string
  telefoni?: string | null
  email?: string | null
  adresa?: string | null
  dataRegjistrimit?: string | null
  piketBesnikerise: number
}

export type UpdateKlientPayload = {
  emri: string
  mbiemri: string
  telefoni?: string | null
  email?: string | null
  adresa?: string | null
  piketBesnikerise: number
}

export function listKlientet() {
  return apiFetch<KlientDto[]>('/api/klientet')
}

export function getKlient(id: string) {
  return apiFetch<KlientDto>(`/api/klientet/${id}`)
}

export function createKlient(body: CreateKlientPayload) {
  return apiFetch<KlientDto>('/api/klientet', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateKlient(id: string, body: UpdateKlientPayload) {
  return apiFetch<KlientDto>(`/api/klientet/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteKlient(id: string) {
  return apiFetch<void>(`/api/klientet/${id}`, { method: 'DELETE' })
}
