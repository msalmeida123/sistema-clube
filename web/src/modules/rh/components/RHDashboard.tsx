'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, Palmtree, AlertCircle, DollarSign, Building2 } from 'lucide-react'
import type { RHStats } from '../types'

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

interface RHDashboardProps {
  stats: RHStats | null
  loading: boolean
}

export function RHDashboard({ stats, loading }: RHDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    { title: 'Total Funcionários', value: stats.total_funcionarios, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Ativos', value: stats.ativos, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Em Férias', value: stats.em_ferias, icon: Palmtree, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Afastados', value: stats.afastados, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Folha do mês e Departamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Folha do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.total_folha_mes)}</p>
            <p className="text-sm text-gray-500 mt-1">Total previsto para o mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Funcionários por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.departamentos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum funcionário cadastrado</p>
            ) : (
              <div className="space-y-2">
                {stats.departamentos.map((dep) => (
                  <div key={dep.nome} className="flex items-center justify-between">
                    <span className="text-sm">{dep.nome}</span>
                    <span className="font-semibold text-sm bg-gray-100 px-2 py-1 rounded">{dep.quantidade}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
