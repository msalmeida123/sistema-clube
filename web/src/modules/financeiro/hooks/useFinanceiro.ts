// Hook Financeiro - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createFinanceiroRepository } from '../repositories/financeiro.repository'
import { createFinanceiroService } from '../services/financeiro.service'
import type { Mensalidade, MensalidadeFilters, FormaPagamento, FinanceiroStats } from '../types'

export function useMensalidades(initialFilters?: MensalidadeFilters) {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MensalidadeFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createFinanceiroRepository(supabase)
  const service = createFinanceiroService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarMensalidades(filters)
      setMensalidades(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensalidades')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrarPorStatus = useCallback((status: Mensalidade['status'] | undefined) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const filtrarPorAssociado = useCallback((associado_id: string | undefined) => {
    setFilters(prev => ({ ...prev, associado_id }))
  }, [])

  const filtrarPorPeriodo = useCallback((data_inicio?: string, data_fim?: string) => {
    setFilters(prev => ({ ...prev, data_inicio, data_fim }))
  }, [])

  return {
    mensalidades,
    loading,
    error,
    filters,
    filtrarPorStatus,
    filtrarPorAssociado,
    filtrarPorPeriodo,
    recarregar: carregar,
  }
}

export function useMensalidade(id: string) {
  const [mensalidade, setMensalidade] = useState<Mensalidade | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createFinanceiroRepository(supabase)
  const service = createFinanceiroService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarMensalidade(id)
        setMensalidade(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar mensalidade')
      } finally {
        setLoading(false)
      }
    }

    if (id) carregar()
  }, [id])

  return { mensalidade, loading, error }
}

export function useFinanceiroStats() {
  const [stats, setStats] = useState<FinanceiroStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createFinanceiroRepository(supabase)
  const service = createFinanceiroService(repository)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await service.obterEstatisticas()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  return { stats, loading, error }
}

export function useFinanceiroMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createFinanceiroRepository(supabase)
  const service = createFinanceiroService(repository)

  const registrarPagamento = useCallback(async (
    id: string,
    valor_pago: number,
    forma_pagamento: FormaPagamento,
    data_pagamento?: string
  ) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.registrarPagamento(id, valor_pago, forma_pagamento, data_pagamento)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pagamento'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const aplicarDesconto = useCallback(async (id: string, desconto: number, motivo?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.aplicarDesconto(id, desconto, motivo)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aplicar desconto'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelar = useCallback(async (id: string, motivo: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.cancelarMensalidade(id, motivo)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar mensalidade'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const gerarCarne = useCallback(async (
    associado_id: string,
    ano: number,
    quantidade_parcelas: number,
    valor_parcela: number,
    dia_vencimento?: number
  ) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.gerarCarne(associado_id, ano, quantidade_parcelas, valor_parcela, dia_vencimento)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar carnê'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    registrarPagamento,
    aplicarDesconto,
    cancelar,
    gerarCarne,
    loading,
    error,
  }
}
