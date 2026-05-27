import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Zona e përmbajtjes brenda AppLayout — gjerësi dhe hapësirë të njëjta si dashboard. */
export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl space-y-6', className)}>{children}</div>
}
