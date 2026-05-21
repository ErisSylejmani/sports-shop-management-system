import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:opacity-90 shadow-md',
  secondary:
    'bg-white/10 text-white border border-white/20 hover:bg-white/15 backdrop-blur',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2 disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
