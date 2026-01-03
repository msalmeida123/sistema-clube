// Hooks de Infracao
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createInfracaosRepository } from '../repositories/infracaos.repository'
import { createInfracaosService } from '../services/infracaos.service'
import type { Infracao, InfracaoFilters, InfracaoFormData } from '../types'

export function useInfracaos(initialFilters?: InfracaoFilters) {
  const [infracaos, setInfracaos] = useState<Infracao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<InfracaoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createInfracaosRepository(supabase)
  const service = createInfracaosService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setInfracaos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
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

  return {
    infracaos,
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function useInfracao(id: string) {
  const [infracao, setInfracao] = useState<Infracao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createInfracaosRepository(supabase)
  const service = createInfracaosService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setInfracao(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { infracao, loading, error }
}

export function useInfracaosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createInfracaosRepository(supabase)
  const service = createInfracaosService(repository)

  const criar = useCallback(async (data: InfracaoFormData) => {
    setLoading(true)
    setError(null)
    try {
      return await service.criar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<InfracaoFormData>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.atualizar(id, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
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
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { criar, atualizar, excluir, loading, error }
}
