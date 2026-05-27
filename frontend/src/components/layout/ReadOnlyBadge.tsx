import { Eye } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useRoleTheme } from '../../context/RoleThemeContext'

type Props = {
  className?: string
}

/** Tregues për stafin (User) — vetëm lexim, në linjë me AppLayout. */
export function ReadOnlyBadge({ className }: Props) {
  const { role } = useRoleTheme()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold',
        role === 'staff'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-slate-50 text-slate-600',
        className,
      )}
    >
      <Eye className="h-3.5 w-3.5" />
      Vetëm lexim
    </span>
  )
}
