import { getAccessToken } from '../auth/token'

const baseUrl = () => import.meta.env.VITE_API_URL as string | undefined

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const root = baseUrl()
  if (!root) throw new ApiError('Mungon VITE_API_URL në .env', 0)

  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${root.replace(/\/$/, '')}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      onUnauthorized &&
      getAccessToken() &&
      !path.includes('/auth/login')
    ) {
      onUnauthorized()
    }

    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Gabim HTTP ${res.status}`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}
