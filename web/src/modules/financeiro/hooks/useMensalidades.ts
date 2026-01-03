// Hooks de Mensalidade
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createMensalidadesRepository } from '../repositories/mensalidades.repository'
import { createMensalidadesService } from '../services/mensalidades.service'
import type { Mensalidade, MensalidadeFilters, MensalidadeFormData } from '../types'

export function useMensalidades(initialFilters?: MensalidadeFilters) {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MensalidadeFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createMensalidadesRepository(supabase)
  const service = createMensalidadesService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setMensalidades(data)
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
    mensalidades,
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function useMensalidade(id: string) {
  const [mensalidade, setMensalidade] = useState<Mensalidade | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createMensalidadesRepository(supabase)
  const service = createMensalidadesService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setMensalidade(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { mensalidade, loading, error }
}

export function useMensalidadesMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createMensalidadesRepository(supabase)
  const service = createMensalidadesService(repository)

  const criar = useCallback(async (data: MensalidadeFormData) => {
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

  const atualizar = useCallback(async (id: string, data: Partial<MensalidadeFormData>) => {
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
