'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { KPICards } from '@/components/dashboard/KPICards'
import { AlertasConversas } from '@/components/dashboard/AlertasConversas'
import { ConversasPorSetor } from '@/components/dashboard/ConversasPorSetor'
import { ResumoFinanceiro } from '@/components/dashboard/ResumoFinanceiro'
import { MetricasWhatsApp } from '@/components/dashboard/MetricasWhatsApp'

export default function DashboardPage() {
  const { data, loading } = useDashboardData()

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <KPICards kpis={data.kpis} loading={loading} />

      {/* Segunda linha - Alertas e Setores */}
      <div className="grid gap-4 md:grid-cols-2">
        <AlertasConversas alertas={data.alertas} loading={loading} />
        <ConversasPorSetor setores={data.setores} loading={loading} />
      </div>

      {/* Terceira linha - Financeiro e Métricas */}
      <div className="grid gap-4 md:grid-cols-2">
        <ResumoFinanceiro financeiro={data.financeiro} loading={loading} />
        <MetricasWhatsApp conversas={data.conversas} metricas={data.metricasHora} loading={loading} />
      </div>
    </div>
  )
}
