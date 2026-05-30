import { listOfertat } from './ofertat'
import { apiFetch } from './client'
import type { KlientDto, ProduktDto, ShitjeSummaryDto } from './types'

export type DashboardData = {
  produktCount: number
  shitjeSotCount: number
  klientCount: number
  ofertaAktiveCount: number
  recentShitjet: ShitjeSummaryDto[]
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [produkte, shitjet, klientet, ofertat] = await Promise.all([
    apiFetch<ProduktDto[]>('/api/produkte'),
    apiFetch<ShitjeSummaryDto[]>('/api/shitjet'),
    apiFetch<KlientDto[]>('/api/klientet'),
    listOfertat({ aktive: true }),
  ])

  return {
    produktCount: produkte.length,
    shitjeSotCount: shitjet.filter((s) => isToday(s.dataShitjes)).length,
    klientCount: klientet.length,
    ofertaAktiveCount: ofertat.length,
    recentShitjet: shitjet.slice(0, 5),
  }
}
