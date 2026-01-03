// Componente de Status Badge - Responsável APENAS por renderizar status
'use client'

import { getStatusColor } from '../utils/formatters'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </span>
  )
}
