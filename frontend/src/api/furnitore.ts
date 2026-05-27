import { apiFetch } from './client'
import type {
  FurnitorDto,
  PorosiFurnitorDetailDto,
  PorosiFurnitorSummaryDto,
} from './types'

export type FurnitorPayload = {
  emri: string
  personiKontaktit?: string | null
  telefoni?: string | null
  email?: string | null
  adresa?: string | null
  qyteti?: string | null
  shteti?: string | null
}

export type PorosiLinePayload = {
  produktId: string
  sasia: number
  cmimiNjesi?: number | null
}

export type CreatePorosiPayload = {
  furnitorId: string
  dataPorosise?: string | null
  dataPritshme?: string | null
  statusi: string
  detajet: PorosiLinePayload[]
}

export type UpdatePorosiPayload = {
  furnitorId: string
  dataPorosise: string
  dataPritshme?: string | null
  statusi: string
  detajet: PorosiLinePayload[]
}

export const listFurnitore = () => apiFetch<FurnitorDto[]>('/api/furnitore')
export const createFurnitor = (body: FurnitorPayload) =>
  apiFetch<FurnitorDto>('/api/furnitore', { method: 'POST', body: JSON.stringify(body) })
export const updateFurnitor = (id: string, body: FurnitorPayload) =>
  apiFetch<FurnitorDto>(`/api/furnitore/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteFurnitor = (id: string) =>
  apiFetch<void>(`/api/furnitore/${id}`, { method: 'DELETE' })

export const listPorosiFurnitore = () =>
  apiFetch<PorosiFurnitorSummaryDto[]>('/api/porosi-furnitore')
export const getPorosiFurnitor = (id: string) =>
  apiFetch<PorosiFurnitorDetailDto>(`/api/porosi-furnitore/${id}`)
export const createPorosiFurnitor = (body: CreatePorosiPayload) =>
  apiFetch<PorosiFurnitorDetailDto>('/api/porosi-furnitore', {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const updatePorosiFurnitor = (id: string, body: UpdatePorosiPayload) =>
  apiFetch<PorosiFurnitorDetailDto>(`/api/porosi-furnitore/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
export const deletePorosiFurnitor = (id: string) =>
  apiFetch<void>(`/api/porosi-furnitore/${id}`, { method: 'DELETE' })
