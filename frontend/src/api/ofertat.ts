import { apiFetch } from './client'
import type { OfertaDetailDto, OfertaSummaryDto } from './types'

export type OfertaPayload = {
  emri: string
  pershkrimi?: string | null
  perqindjaZbritjes: number
  dataFillimit: string
  dataPerfundimit: string
  statusi: string
  produktIds: string[]
}

export type ListOfertatParams = {
  statusi?: string
  aktive?: boolean
}

export function listOfertat(params?: ListOfertatParams) {
  const qs = new URLSearchParams()
  if (params?.statusi) qs.set('statusi', params.statusi)
  if (params?.aktive !== undefined) qs.set('aktive', String(params.aktive))
  const query = qs.toString()
  return apiFetch<OfertaSummaryDto[]>(`/api/ofertat${query ? `?${query}` : ''}`)
}

export function getOferta(id: string) {
  return apiFetch<OfertaDetailDto>(`/api/ofertat/${id}`)
}

export function createOferta(body: OfertaPayload) {
  return apiFetch<OfertaDetailDto>('/api/ofertat', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateOferta(id: string, body: OfertaPayload) {
  return apiFetch<OfertaDetailDto>(`/api/ofertat/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteOferta(id: string) {
  return apiFetch<void>(`/api/ofertat/${id}`, { method: 'DELETE' })
}
