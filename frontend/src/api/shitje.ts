import { apiFetch } from './client'
import type { CreateShitjeResponse, ShitjeDetailDto, ShitjeSummaryDto } from './types'

export type ShitjeLinePayload = {
  produktId: string
  sasia: number
}

export type CreateShitjePayload = {
  klientId: string
  punetorId: string
  dataShitjes?: string | null
  zbritja: number
  metodaPageses: string
  detajet: ShitjeLinePayload[]
}

export type ListShitjetParams = {
  klientId?: string
  punetorId?: string
}

export function listShitjet(params?: ListShitjetParams) {
  const qs = new URLSearchParams()
  if (params?.klientId) qs.set('klientId', params.klientId)
  if (params?.punetorId) qs.set('punetorId', params.punetorId)
  const query = qs.toString()
  return apiFetch<ShitjeSummaryDto[]>(`/api/shitjet${query ? `?${query}` : ''}`)
}

export function getShitje(id: string) {
  return apiFetch<ShitjeDetailDto>(`/api/shitjet/${id}`)
}

export function createShitje(body: CreateShitjePayload) {
  return apiFetch<CreateShitjeResponse>('/api/shitjet', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
