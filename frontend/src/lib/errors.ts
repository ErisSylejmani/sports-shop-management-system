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

/** Mesazh API + lista Identity `errors[]` (admin users/roles). */
export function resolveApiValidationError(err: unknown, fallback: string): string {
  const base = resolveApiError(err, fallback)
  if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'errors' in err.body) {
    const errors = (err.body as { errors: unknown }).errors
    if (Array.isArray(errors) && errors.length > 0) {
      return `${base} (${errors.join('; ')})`
    }
  }
  return base
}
