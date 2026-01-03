// Componente de Cards de Estatísticas - Responsável APENAS por renderizar stats
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  CheckCircle, Receipt, Ticket, AlertCircle, PiggyBank
} from 'lucide-react'
import type { FinanceiroStats } from '../types'
import { formatCurrency } from '../utils/formatters'

interface StatsCardsProps {
  stats: FinanceiroStats
  loading?: boolean
}

export function StatsCardsPrincipais({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-24 bg-gray-100" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Receita do Mês</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.receitaMes)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Despesas do Mês</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.despesaMes)}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">A Receber</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.aReceber)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">A Pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.aPagar)}</p>
            </div>
            <CreditCard className="h-10 w-10 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StatsCardsSecundarios({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-20 bg-gray-50" />
          </Card>
        ))}
      </div>
    )
  }

  const items = [
    { 
      icon: CheckCircle, 
      color: 'green', 
      value: stats.mensalidadesPagas, 
      label: 'Mensalidades Pagas' 
    },
    { 
      icon: Receipt, 
      color: 'blue', 
      value: stats.parcelasPagas, 
      label: 'Parcelas Pagas' 
    },
    { 
      icon: Ticket, 
      color: 'purple', 
      value: stats.convitesMes, 
      label: 'Convites no Mês' 
    },
    { 
      icon: AlertCircle, 
      color: 'red', 
      value: stats.inadimplentes, 
      label: 'Inadimplentes' 
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-3 bg-${item.color}-100 rounded-full`}>
              <item.icon className={`h-6 w-6 text-${item.color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SaldoCard({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-28 bg-gray-50" />
      </Card>
    )
  }

  const saldo = stats.receitaMes - stats.despesaMes
  const positivo = saldo >= 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Saldo do Mês (Receitas - Despesas)</p>
            <p className={`text-4xl font-bold ${positivo ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
          <PiggyBank className={`h-16 w-16 ${positivo ? 'text-green-200' : 'text-red-200'}`} />
        </div>
      </CardContent>
    </Card>
  )
}
