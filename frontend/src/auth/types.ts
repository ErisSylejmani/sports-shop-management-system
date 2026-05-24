export type MeResponse = {
  id: string
  email: string
  emri: string
  mbiemri: string
  phoneNumber?: string | null
  eshteAktiv: boolean
  punetorId?: string | null
  punetorEmri?: string | null
  roles: string[]
  isStaff: boolean
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  userId: string
  email: string
  emri: string
  mbiemri: string
  roles: string[]
}

export type AuthUser = MeResponse
