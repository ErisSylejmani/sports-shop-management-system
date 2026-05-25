export type ProduktDto = {
  produktId: string
  emri: string
  kategoriEmri: string
  marka: string
  cmimiShitjes: number
  sasiaStok: number
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
