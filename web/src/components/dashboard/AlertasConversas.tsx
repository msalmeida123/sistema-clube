'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Phone } from 'lucide-react'
import { AlertaConversa } from '@/lib/supabase-views'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface AlertasConversasProps {
  alertas: AlertaConversa[]
  loading: boolean
}

export function AlertasConversas({ alertas, loading }: AlertasConversasProps) {
  const getBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'critico': return 'destructive'
      case 'alerta': return 'default'
      case 'atencao': return 'secondary'
      default: return 'outline'
    }
  }

  const getNivelLabel = (nivel: string) => {
    switch (nivel) {
      case 'critico': return '🔴 Crítico'
      case 'alerta': return '🟠 Alerta'
      case 'atencao': return '🟡 Atenção'
      default: return '🟢 OK'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Conversas Aguardando
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Conversas Aguardando
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            ✅ Nenhuma conversa parada no momento
          </p>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <Link 
                key={alerta.id} 
                href={`/dashboard/crm?conversa=${alerta.id}`}
                className="block"
              >
                <div className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{alerta.nome_contato || 'Sem nome'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {alerta.telefone}
                    </div>
                    {alerta.setor && (
                      <p className="text-xs text-muted-foreground">{alerta.setor}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getBadgeVariant(alerta.nivel_alerta)}>
                      {getNivelLabel(alerta.nivel_alerta)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {Math.round(alerta.horas_parado)}h
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
