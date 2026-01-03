// Componente Lista de Registros Recentes
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogIn, LogOut } from 'lucide-react'
import type { RegistroAcesso } from '../types'

interface RegistrosRecentesProps {
  registros: RegistroAcesso[]
  loading?: boolean
  maxItems?: number
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function RegistrosRecentes({ 
  registros, 
  loading, 
  maxItems = 10 
}: RegistrosRecentesProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-200 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum registro hoje
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {registros.slice(0, maxItems).map((registro) => (
        <div 
          key={registro.id} 
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={registro.pessoa_foto} />
            <AvatarFallback>{registro.pessoa_nome?.[0] || '?'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{registro.pessoa_nome}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {registro.tipo_pessoa}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {registro.tipo === 'entrada' ? (
              <LogIn className="h-4 w-4 text-green-600" />
            ) : (
              <LogOut className="h-4 w-4 text-red-600" />
            )}
            <span className="text-muted-foreground">
              {formatTime(registro.data_hora)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
