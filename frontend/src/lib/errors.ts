import { ApiError } from '../api/client'

export function resolveApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message
    if (err.status === 401) return 'Sesioni ka skaduar. Hyni përsëri.'
    if (err.status === 403) return 'Nuk keni leje për këtë veprim.'
    if (err.status === 409) return err.message
    return err.message
  }
  return fallback
}
