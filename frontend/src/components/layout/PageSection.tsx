import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl space-y-6', className)}>{children}</div>
}
