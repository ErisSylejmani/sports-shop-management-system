import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 transition focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]/30 disabled:cursor-not-allowed disabled:opacity-60'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Select({ label, hint, error, className, id, children, ...props }: Props) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(fieldClass, error && 'border-red-400 focus:border-red-500', className)}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
