import { Link, Outlet } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { canAccessAdmin } from '../../auth/permissions'
import { Alert } from '../ui/Alert'
import { useAuth } from '../../context/AuthContext'

/** Kufizon rrugët /admin/* vetëm për përdorues me rol Admin. */
export function AdminRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Duke u ngarkuar...</p>
      </div>
    )
  }

  if (!canAccessAdmin(user?.roles)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <div className="flex items-center gap-3 text-slate-800">
          <ShieldX className="h-8 w-8 text-red-500" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold">403 — E ndaluar</h1>
            <p className="text-sm text-slate-600">Nuk keni leje për këtë veprim.</p>
          </div>
        </div>
        <Alert variant="error">
          Moduli Admin (përdoruesit dhe rolet) është i rezervuar vetëm për llogari me rol{' '}
          <strong>Admin</strong>.
        </Alert>
        <Link
          to="/"
          className="inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Kthehu te dashboard
        </Link>
      </div>
    )
  }

  return <Outlet />
}
