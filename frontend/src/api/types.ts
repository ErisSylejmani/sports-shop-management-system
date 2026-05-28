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

export type ShitjeDetajDto = {
  detajShitjeId: string
  produktId: string
  produktEmri: string
  sasia: number
  cmimiNjesi: number
  cmimiTotal: number
}

export type ShitjeDetailDto = {
  shitjeId: string
  klientId: string
  klientEmri: string
  punetorId: string
  punetorEmri: string
  dataShitjes: string
  shumaParaZbritjes: number
  zbritja: number
  shumaTotale: number
  metodaPageses: string
  detajet: ShitjeDetajDto[]
}

export type CreateShitjeResponse = {
  shitjeId: string
  shumaParaZbritjes: number
  zbritja: number
  shumaTotale: number
  detajet: ShitjeDetajDto[]
}

export type KlientDto = {
  klientId: string
  emri: string
  mbiemri: string
  telefoni?: string | null
  email?: string | null
  adresa?: string | null
  dataRegjistrimit: string
  piketBesnikerise: number
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

export type FurnitorDto = {
  furnitorId: string
  emri: string
  personiKontaktit?: string | null
  telefoni?: string | null
  email?: string | null
  adresa?: string | null
  qyteti?: string | null
  shteti?: string | null
}

export type PorosiFurnitorSummaryDto = {
  porosiId: string
  furnitorId: string
  furnitorEmri: string
  dataPorosise: string
  dataPritshme?: string | null
  shumaTotale: number
  statusi: string
}

export type PorosiFurnitorDetajDto = {
  detajPorosiId: string
  produktId: string
  produktEmri: string
  sasia: number
  cmimiNjesi: number
  cmimiTotal: number
}

export type PorosiFurnitorDetailDto = {
  porosiId: string
  furnitorId: string
  furnitorEmri: string
  dataPorosise: string
  dataPritshme?: string | null
  shumaTotale: number
  statusi: string
  detajet: PorosiFurnitorDetajDto[]
}

export type PunetorDto = {
  punetorId: string
  emri: string
  mbiemri: string
  pozita: string
  telefoni?: string | null
  email?: string | null
  dataPunesimit: string
  paga: number
  userId?: string | null
}

export type KthimDto = {
  kthimId: string
  shitjeId: string
  produktId: string
  produktEmri: string
  dataShitjes: string
  sasia: number
  arsyeja: string
  dataKthimit: string
  statusi: string
}
