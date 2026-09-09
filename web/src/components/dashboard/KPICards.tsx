'use client'

import { PainelDashboard, COLUNAS_KPI } from '@/lib/dashboard-visibilidade'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, AlertCircle, DollarSign, Clock, Home, Key, UserCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { KPIs } from '@/lib/supabase-views'
import { Skeleton } from '@/components/ui/skeleton'

interface KPICardsProps {
  kpis: KPIs | null
  loading: boolean
  paineis: PainelDashboard[]
}

export function KPICards({ kpis, loading, paineis }: KPICardsProps) {
  const total = paineis.filter(p=>COLUNAS_KPI[p]).length
  if (!total) return null
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(total)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    { id: 'associados', title: 'Associados Ativos', value: kpis?.associados_ativos || 0, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'conversas', title: 'Conversas Abertas', value: kpis?.conversas_abertas || 0, icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'mensalidades', title: 'Mensalidades Atrasadas', value: kpis?.mensalidades_atrasadas || 0, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'inadimplencia', title: 'Inadimplência', value: formatCurrency(kpis?.valor_inadimplencia || 0), icon: DollarSign, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ]

  const cardsSecondary = [
    { id: 'acessos', title: 'Acessos Hoje', value: kpis?.acessos_hoje || 0, icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'quiosques', title: 'Quiosques Reservados', value: kpis?.quiosques_reservados_hoje || 0, icon: Home, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'armarios', title: 'Armários em Uso', value: kpis?.armarios_em_uso || 0, icon: Key, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'dependentes', title: 'Dependentes Ativos', value: kpis?.dependentes_ativos || 0, icon: UserCheck, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.filter(card=>paineis.includes(card.id as PainelDashboard)).map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardsSecondary.filter(card=>paineis.includes(card.id as PainelDashboard)).map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
