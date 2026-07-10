'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
  max?: number
  /** Rótulo para leitores de tela. Padrão: "N notificações não lidas". */
  srLabel?: string
}

export function NotificationBadge({ count, className, max = 99, srLabel }: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()
  const label = srLabel ?? `${count} ${count === 1 ? 'notificação não lida' : 'notificações não lidas'}`

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
        "flex items-center justify-center",
        "bg-destructive text-destructive-foreground text-[11px] font-bold leading-none tabular-nums rounded-full",
        "animate-in fade-in-0 zoom-in-50 duration-200",
        className
      )}
    >
      <span aria-hidden="true">{displayCount}</span>
    </span>
  )
}

// Variante para ícone inline (ao lado do texto)
export function NotificationBadgeInline({ count, className, max = 99, srLabel }: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()
  const label = srLabel ?? `${count} ${count === 1 ? 'notificação não lida' : 'notificações não lidas'}`

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "ml-auto min-w-[20px] h-[20px] px-1.5",
        "flex items-center justify-center",
        "bg-destructive text-destructive-foreground text-xs font-bold leading-none tabular-nums rounded-full",
        "animate-in fade-in-0 zoom-in-50 duration-200",
        className
      )}
    >
      <span aria-hidden="true">{displayCount}</span>
    </span>
  )
}
