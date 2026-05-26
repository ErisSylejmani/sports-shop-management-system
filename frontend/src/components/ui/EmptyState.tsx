import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '../../lib/cn'

type Props = {
  message: string
  icon?: LucideIcon
  className?: string
}

export function EmptyState({ message, icon: Icon = Inbox, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 text-center',
        className,
      )}
    >
      <Icon className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  )
}
