export type ProduktDto = {
  produktId: string
  emri: string
  pershkrimi?: string | null
  kategoriId: string
  kategoriEmri: string
  marka: string
  cmimiBlerjes: number
  cmimiShitjes: number
  sasiaStok: number
  madhesia?: string | null
  ngjyra?: string | null
}

export type KategoriDto = {
  kategoriId: string
  emri: string
  pershkrimi?: string | null
  kategoriaPrindId?: string | null
}

export type ShitjeSummaryDto = {
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

export type KlientDto = {
  klientId: string
  emri: string
  mbiemri: string
}

export type OfertaSummaryDto = {
  ofertaId: string
  emri: string
  perqindjaZbritjes: number
  dataFillimit: string
  dataPerfundimit: string
  statusi: string
  numriProdukteve: number
}
