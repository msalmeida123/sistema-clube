'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardFinanceiro, getDashboardFinanceiro } from '@/lib/supabase-views'
import { Skeleton } from '@/components/ui/skeleton'

export function ResumoFinanceiro() {
  const [financeiro, setFinanceiro] = useState<DashboardFinanceiro | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getDashboardFinanceiro()
      setFinanceiro(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Valor Recebido */}
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Recebido</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(financeiro?.valor_recebido || 0)}
            </p>
            <p className="text-xs text-green-600">
              {financeiro?.pagas || 0} mensalidades pagas
            </p>
          </div>

          {/* Valor Pendente */}
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Pendente</span>
            </div>
            <p className="text-xl font-bold text-yellow-700">
              {formatCurrency(financeiro?.valor_pendente || 0)}
            </p>
            <p className="text-xs text-yellow-600">
              {financeiro?.pendentes || 0} a receber
            </p>
          </div>

          {/* Valor Atrasado */}
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Atrasado</span>
            </div>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(financeiro?.valor_atrasado || 0)}
            </p>
            <p className="text-xs text-red-600">
              {financeiro?.atrasadas || 0} mensalidades
            </p>
          </div>

          {/* Vencendo em breve */}
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Vencendo em 7 dias</span>
            </div>
            <p className="text-xl font-bold text-orange-700">
              {financeiro?.vencendo_7_dias || 0}
            </p>
            <p className="text-xs text-orange-600">
              mensalidades próximas
            </p>
          </div>
        </div>

        {/* Resumo total */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total de mensalidades:</span>
            <span className="font-medium">{financeiro?.total_mensalidades || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
