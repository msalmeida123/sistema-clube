'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { DashboardConversas, getDashboardConversas, getMetricasPorHora, MetricaPorHora } from '@/lib/supabase-views'
import { Skeleton } from '@/components/ui/skeleton'

export function MetricasWhatsApp() {
  const [conversas, setConversas] = useState<DashboardConversas | null>(null)
  const [metricas, setMetricas] = useState<MetricaPorHora[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [conv, met] = await Promise.all([
        getDashboardConversas(),
        getMetricasPorHora()
      ])
      setConversas(conv)
      setMetricas(met)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Métricas WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Encontrar horário de pico
  const horarioPico = metricas.reduce((max, m) => 
    m.total_mensagens > (max?.total_mensagens || 0) ? m : max, 
    metricas[0]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-500" />
          Métricas WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Resumo de status */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">{conversas?.novos || 0}</p>
            <p className="text-xs text-blue-500">Novos</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50">
            <p className="text-2xl font-bold text-yellow-600">{conversas?.em_atendimento || 0}</p>
            <p className="text-xs text-yellow-500">Em Atendimento</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">{conversas?.resolvidos || 0}</p>
            <p className="text-xs text-green-500">Resolvidos</p>
          </div>
        </div>

        {/* Gráfico simplificado de horários */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Mensagens por hora (últimos 30 dias)</p>
          <div className="flex items-end gap-1 h-16">
            {metricas.map((m) => {
              const maxMensagens = Math.max(...metricas.map(x => x.total_mensagens), 1)
              const height = (m.total_mensagens / maxMensagens) * 100
              return (
                <div
                  key={m.hora}
                  className="flex-1 bg-green-200 hover:bg-green-400 transition-colors rounded-t cursor-pointer relative group"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${m.hora}h: ${m.total_mensagens} mensagens`}
                >
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {m.hora}h: {m.total_mensagens}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>23h</span>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Horário de pico</p>
              <p className="font-medium">{horarioPico?.hora || 0}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              <p className="font-medium">{conversas?.ultimos_7_dias || 0} conversas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
