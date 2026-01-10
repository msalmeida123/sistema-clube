'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, MessageSquare, AlertCircle, DollarSign, Clock, Home, Key } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { KPIs, getKPIs } from '@/lib/supabase-views'
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
