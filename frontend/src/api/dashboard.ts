import { apiFetch } from './client'
import type { KlientDto, OfertaSummaryDto, ProduktDto, ShitjeSummaryDto } from './types'

export type DashboardData = {
  produktCount: number
  shitjeCount: number
  klientCount: number
  ofertaAktiveCount: number
  recentShitjet: ShitjeSummaryDto[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [produkte, shitjet, klientet, ofertat] = await Promise.all([
    apiFetch<ProduktDto[]>('/api/produkte'),
    apiFetch<ShitjeSummaryDto[]>('/api/shitjet'),
    apiFetch<KlientDto[]>('/api/klientet'),
    apiFetch<OfertaSummaryDto[]>('/api/ofertat?aktive=true'),
  ])

  return {
    produktCount: produkte.length,
    shitjeCount: shitjet.length,
    klientCount: klientet.length,
    ofertaAktiveCount: ofertat.length,
    recentShitjet: shitjet.slice(0, 5),
  }
}
