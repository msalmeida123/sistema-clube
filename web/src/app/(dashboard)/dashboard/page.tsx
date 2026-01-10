'use client'

import { KPICards } from '@/components/dashboard/KPICards'
import { AlertasConversas } from '@/components/dashboard/AlertasConversas'
import { ConversasPorSetor } from '@/components/dashboard/ConversasPorSetor'
import { ResumoFinanceiro } from '@/components/dashboard/ResumoFinanceiro'
import { MetricasWhatsApp } from '@/components/dashboard/MetricasWhatsApp'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <KPICards />

      {/* Segunda linha - Alertas e Setores */}
      <div className="grid gap-4 md:grid-cols-2">
        <AlertasConversas />
        <ConversasPorSetor />
      </div>

      {/* Terceira linha - Financeiro e Métricas */}
      <div className="grid gap-4 md:grid-cols-2">
        <ResumoFinanceiro />
        <MetricasWhatsApp />
      </div>
    </div>
  )
}
