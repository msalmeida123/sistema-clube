// Hook - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAssociadosRepository } from '../repositories/associados.repository'
import { createAssociadosService } from '../services/associados.service'
import type { Associado, AssociadoFilters, AssociadoFormData } from '../types'

export function useAssociados(initialFilters?: AssociadoFilters) {
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssociadoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createAssociadosRepository(supabase)
  const service = createAssociadosService(repository)

  // Carregar associados
  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setAssociados(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar associados')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Carregar ao montar e quando filtros mudarem
  useEffect(() => {
    carregar()
  }, [carregar])

  // Buscar
  const buscar = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  // Filtrar por status
  const filtrarPorStatus = useCallback((status: Associado['status'] | undefined) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  // Filtrar por plano
  const filtrarPorPlano = useCallback((plano: Associado['plano'] | undefined) => {
    setFilters(prev => ({ ...prev, plano }))
  }, [])

  // Recarregar
  const recarregar = useCallback(() => {
    carregar()
  }, [carregar])

  return {
    associados,
    loading,
    error,
    filters,
    buscar,
    filtrarPorStatus,
    filtrarPorPlano,
    recarregar,
  }
}

export function useAssociado(id: string) {
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAssociadosRepository(supabase)
  const service = createAssociadosService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await service.buscarPorId(id)
        setAssociado(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar associado')
      } finally {
        setLoading(false)
      }
    }

    if (id) carregar()
  }, [id])

  return { associado, loading, error }
}

export function useAssociadoMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAssociadosRepository(supabase)
  const service = createAssociadosService(repository)

  const criar = useCallback(async (data: AssociadoFormData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.criar(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar associado'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<AssociadoFormData>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.atualizar(id, data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar associado'
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
      const message = err instanceof Error ? err.message : 'Erro ao excluir associado'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const desativar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.desativar(id)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desativar associado'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    criar,
    atualizar,
    excluir,
    desativar,
    loading,
    error,
  }
}
