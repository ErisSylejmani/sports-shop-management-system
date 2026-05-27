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

// ——— Kategoritë ———

export function listKategorite() {
  return apiFetch<KategoriDto[]>('/api/kategorite')
}

export function getKategori(id: string) {
  return apiFetch<KategoriDto>(`/api/kategorite/${id}`)
}

export function createKategori(body: KategoriPayload) {
  return apiFetch<KategoriDto>('/api/kategorite', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateKategori(id: string, body: KategoriPayload) {
  return apiFetch<KategoriDto>(`/api/kategorite/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteKategori(id: string) {
  return apiFetch<void>(`/api/kategorite/${id}`, { method: 'DELETE' })
}

// ——— Produktet ———

export function listProdukte(kategoriId?: string) {
  const qs = kategoriId ? `?kategoriId=${encodeURIComponent(kategoriId)}` : ''
  return apiFetch<ProduktDto[]>(`/api/produkte${qs}`)
}

export function getProdukt(id: string) {
  return apiFetch<ProduktDto>(`/api/produkte/${id}`)
}

export function createProdukt(body: ProduktPayload) {
  return apiFetch<ProduktDto>('/api/produkte', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateProdukt(id: string, body: ProduktPayload) {
  return apiFetch<ProduktDto>(`/api/produkte/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteProdukt(id: string) {
  return apiFetch<void>(`/api/produkte/${id}`, { method: 'DELETE' })
}
