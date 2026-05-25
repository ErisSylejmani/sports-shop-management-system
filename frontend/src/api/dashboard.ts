import { apiFetch } from './client'

export type ShitjeSummary = {
  shitjeId: string
  klientId: string
  klientEmri: string
  punetorId: string
  punetorEmri: string
  dataShitjes: string
  shumaTotale: number
  zbritja: number
  metodaPageses: string
}

export type OfertaSummary = {
  ofertaId: string
  emri: string
  perqindjaZbritjes: number
  dataFillimit: string
  dataPerfundimit: string
  statusi: string
  numriProdukteve: number
}

export type DashboardStats = {
  produkteCount: number
  klientetCount: number
  ofertatAktiveCount: number
  shitjeSotCount: number
  recentShitje: ShitjeSummary[]
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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [produkte, shitjet, klientet, ofertat] = await Promise.all([
    apiFetch<unknown[]>('/api/produkte'),
    apiFetch<ShitjeSummary[]>('/api/shitjet'),
    apiFetch<unknown[]>('/api/klientet'),
    apiFetch<OfertaSummary[]>('/api/ofertat?aktive=true'),
  ])

  return {
    produkteCount: produkte.length,
    klientetCount: klientet.length,
    ofertatAktiveCount: ofertat.length,
    shitjeSotCount: shitjet.filter((s) => isToday(s.dataShitjes)).length,
    recentShitje: shitjet.slice(0, 5),
  }
}
