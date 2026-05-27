import { apiFetch } from './client'
import type { PunetorDto } from './types'

export type CreatePunetorPayload = {
  emri: string
  mbiemri: string
  pozita: string
  telefoni?: string | null
  email: string
  password: string
  dataPunesimit?: string | null
  paga: number
}

export type UpdatePunetorPayload = {
  emri: string
  mbiemri: string
  pozita: string
  telefoni?: string | null
  email?: string | null
  dataPunesimit: string
  paga: number
}

export function listPunetoret() {
  return apiFetch<PunetorDto[]>('/api/punetoret')
}

export function getPunetor(id: string) {
  return apiFetch<PunetorDto>(`/api/punetoret/${id}`)
}

export function createPunetor(body: CreatePunetorPayload) {
  return apiFetch<PunetorDto>('/api/punetoret', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updatePunetor(id: string, body: UpdatePunetorPayload) {
  return apiFetch<PunetorDto>(`/api/punetoret/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deletePunetor(id: string) {
  return apiFetch<void>(`/api/punetoret/${id}`, { method: 'DELETE' })
}
