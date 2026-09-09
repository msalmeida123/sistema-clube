'use client'

import { COLUNAS_KPI, PainelDashboard } from '@/lib/dashboard-visibilidade'
import { useEffect, useState, useCallback } from 'react'
import {
  KPIs, getKPIs,
  AlertaConversa, getAlertasConversas,
  ConversaPorSetor, getConversasPorSetor,
  DashboardFinanceiro, getDashboardFinanceiro,
  DashboardConversas, getDashboardConversas,
  MetricaPorHora, getMetricasPorHora
} from '@/lib/supabase-views'

export interface DashboardData {
  kpis: KPIs | null
  alertas: AlertaConversa[]
  setores: ConversaPorSetor[]
  financeiro: DashboardFinanceiro | null
  conversas: DashboardConversas | null
  metricasHora: MetricaPorHora[]
}

export async function carregarDadosDashboard(paineis: PainelDashboard[]) {
    const permitidos = paineis
    const tem = (painel: PainelDashboard) => permitidos.includes(painel)
    const colunas = permitidos.map(p=>COLUNAS_KPI[p]).filter(Boolean).join(',')


      const [kpis, alertas, setores, financeiro, conversas, metricasHora] = await Promise.all([
        colunas ? getKPIs(colunas) : Promise.resolve(null),
        tem('alertas') ? getAlertasConversas(5) : Promise.resolve([]),
        tem('setores') ? getConversasPorSetor() : Promise.resolve([]),
        tem('financeiro') ? getDashboardFinanceiro() : Promise.resolve(null),
        tem('metricas') ? getDashboardConversas() : Promise.resolve(null),
        tem('metricas') ? getMetricasPorHora() : Promise.resolve([])
      ])


 return { kpis, alertas, setores, financeiro, conversas, metricasHora }
}

export function useDashboardData(paineis: PainelDashboard[], configurando: boolean) {
  const [data, setData] = useState<DashboardData>({
    kpis: null,
    alertas: [],
    setores: [],
    financeiro: null,
    conversas: null,
    metricasHora: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const chave = paineis.join(',')
  const fetchAll = useCallback(async () => {
    if (configurando) return
    setLoading(true)
    try {
      const {kpis,alertas,setores,financeiro,conversas,metricasHora}=await carregarDadosDashboard(chave.split(',') as PainelDashboard[])
      setData({ kpis, alertas, setores, financeiro, conversas, metricasHora })
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [chave, configurando])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, loading, error, refetch: fetchAll }
}
