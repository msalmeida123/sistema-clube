'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
  max?: number
}

export function NotificationBadge({ count, className, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
        "flex items-center justify-center",
        "bg-red-500 text-white text-[10px] font-bold rounded-full",
        "animate-pulse",
        className
      )}
    >
      {displayCount}
    </span>
  )
}

// Variante para ícone inline (ao lado do texto)
export function NotificationBadgeInline({ count, className, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <span
      className={cn(
        "ml-auto min-w-[20px] h-[20px] px-1.5",
        "flex items-center justify-center",
        "bg-red-500 text-white text-xs font-bold rounded-full",
        className
      )}
    >
      {displayCount}
    </span>
  )
}
