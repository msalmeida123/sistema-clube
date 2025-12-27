'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalAssociados: 0, ativos: 0, inadimplentes: 0, receitaMes: 0 })
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { count: total } = await supabase.from('associados').select('*', { count: 'exact', head: true })
      const { count: ativos } = await supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status', 'ativo')
      const { count: inadimplentes } = await supabase.from('mensalidades').select('*', { count: 'exact', head: true }).eq('status', 'atrasado')
      const mes = new Date().toISOString().slice(0, 7)
      const { data: receitas } = await supabase.from('mensalidades').select('valor_pago').eq('referencia', mes).eq('status', 'pago')
      const receitaMes = receitas?.reduce((acc, r) => acc + (r.valor_pago || 0), 0) || 0
      setStats({ totalAssociados: total || 0, ativos: ativos || 0, inadimplentes: inadimplentes || 0, receitaMes })
    }
    fetchStats()
  }, [supabase])

  const cards = [
    { title: 'Total Associados', value: stats.totalAssociados, icon: Users, color: 'text-blue-600' },
    { title: 'Associados Ativos', value: stats.ativos, icon: UserCheck, color: 'text-green-600' },
    { title: 'Inadimplentes', value: stats.inadimplentes, icon: AlertCircle, color: 'text-red-600' },
    { title: 'Receita do Mês', value: formatCurrency(stats.receitaMes), icon: CreditCard, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Últimos Associados</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Carregando...</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Últimas Entradas</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Carregando...</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
