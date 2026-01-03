// Hook Compras - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createComprasRepository } from '../repositories/compras.repository'
import { createComprasService } from '../services/compras.service'
import type { Compra, CompraFilters, CompraFormData, Fornecedor, ComprasStats } from '../types'

export function useCompras(initialFilters?: CompraFilters) {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CompraFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createComprasRepository(supabase)
  const service = createComprasService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setCompras(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar compras')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    carregar()
  }, [carregar])

  const buscar = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const filtrarPorStatus = useCallback((status: Compra['status'] | undefined) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  return {
    compras,
    loading,
    error,
    filters,
    buscar,
    filtrarPorStatus,
    recarregar: carregar,
  }
}

export function useCompra(id: string) {
  const [compra, setCompra] = useState<Compra | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createComprasRepository(supabase)
  const service = createComprasService(repository)

  useEffect(() => {
    const carregar = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setCompra(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar compra')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [id])

  return { compra, loading, error }
}

export function useComprasMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createComprasRepository(supabase)
  const service = createComprasService(repository)

  const criar = useCallback(async (data: CompraFormData, usuario_id?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.criar(data, usuario_id)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<CompraFormData>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.atualizar(id, data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const aprovar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await service.aprovar(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const finalizar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await service.finalizar(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelar = useCallback(async (id: string, motivo?: string) => {
    setLoading(true)
    setError(null)
    try {
      return await service.cancelar(id, motivo)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarPagamento = useCallback(async (id: string, valor: number) => {
    setLoading(true)
    setError(null)
    try {
      return await service.registrarPagamento(id, valor)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pagamento'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.excluir(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir compra'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    criar,
    atualizar,
    aprovar,
    finalizar,
    cancelar,
    registrarPagamento,
    excluir,
    loading,
    error,
  }
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()
  const repository = createComprasRepository(supabase)
  const service = createComprasService(repository)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await service.listarFornecedores()
        setFornecedores(data)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const criar = useCallback(async (data: Partial<Fornecedor>) => {
    const result = await service.criarFornecedor(data)
    setFornecedores(prev => [...prev, result])
    return result
  }, [])

  return { fornecedores, loading, criar }
}

export function useComprasStats() {
  const [stats, setStats] = useState<ComprasStats | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()
  const repository = createComprasRepository(supabase)
  const service = createComprasService(repository)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await service.obterEstatisticas()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  return { stats, loading }
}
