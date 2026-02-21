'use client'

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

export function useDashboardData() {
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

  const fetchAll = useCallback(async () => {
    try {
      const [kpis, alertas, setores, financeiro, conversas, metricasHora] = await Promise.all([
        getKPIs(),
        getAlertasConversas(5),
        getConversasPorSetor(),
        getDashboardFinanceiro(),
        getDashboardConversas(),
        getMetricasPorHora()
      ])

      setData({ kpis, alertas, setores, financeiro, conversas, metricasHora })
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, loading, error, refetch: fetchAll }
}
