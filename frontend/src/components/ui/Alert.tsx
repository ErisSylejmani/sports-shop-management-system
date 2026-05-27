import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'error' | 'warning' | 'info' | 'success'

const styles: Record<Variant, { box: string; icon: string; Icon: typeof AlertCircle }> = {
  error: {
    box: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
    Icon: AlertTriangle,
  },
  info: {
    box: 'border-slate-200 bg-slate-50 text-slate-800',
    icon: 'text-slate-500',
    Icon: Info,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
}

type Props = {
  variant?: Variant
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'error', title, children, className }: Props) {
  const { box, icon, Icon } = styles[variant]
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', box, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', icon)} />
      <div>
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
