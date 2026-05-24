import { apiFetch } from './client'
import type { LoginResponse, MeResponse } from '../auth/types'

export type LoginBody = {
  email: string
  password: string
}

export function login(body: LoginBody) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchMe() {
  return apiFetch<MeResponse>('/api/me')
}

export function logout(refreshToken: string) {
  return apiFetch<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}
