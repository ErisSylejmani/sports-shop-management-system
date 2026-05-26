import { apiFetch } from './client'
import type { KategoriDto, ProduktDto } from './types'

export type KategoriPayload = {
  emri: string
  pershkrimi?: string | null
  kategoriaPrindId?: string | null
}

export type ProduktPayload = {
  emri: string
  pershkrimi?: string | null
  kategoriId: string
  marka: string
  cmimiBlerjes: number
  cmimiShitjes: number
  sasiaStok: number
  madhesia?: string | null
  ngjyra?: string | null
}

export const listKategorite = () => apiFetch<KategoriDto[]>('/api/kategorite')

export const createKategori = (body: KategoriPayload) =>
  apiFetch<KategoriDto>('/api/kategorite', { method: 'POST', body: JSON.stringify(body) })

export const updateKategori = (id: string, body: KategoriPayload) =>
  apiFetch<KategoriDto>(`/api/kategorite/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteKategori = (id: string) =>
  apiFetch<void>(`/api/kategorite/${id}`, { method: 'DELETE' })

export const listProdukte = () => apiFetch<ProduktDto[]>('/api/produkte')

export const createProdukt = (body: ProduktPayload) =>
  apiFetch<ProduktDto>('/api/produkte', { method: 'POST', body: JSON.stringify(body) })

export const updateProdukt = (id: string, body: ProduktPayload) =>
  apiFetch<ProduktDto>(`/api/produkte/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteProdukt = (id: string) =>
  apiFetch<void>(`/api/produkte/${id}`, { method: 'DELETE' })
