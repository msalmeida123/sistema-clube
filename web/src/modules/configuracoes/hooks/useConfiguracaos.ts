// Hooks de Configuracao
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createConfiguracaosRepository } from '../repositories/configuracaos.repository'
import { createConfiguracaosService } from '../services/configuracaos.service'
import type { Configuracao, ConfiguracaoFilters, ConfiguracaoFormData } from '../types'

export function useConfiguracaos(initialFilters?: ConfiguracaoFilters) {
  const [configuracaos, setConfiguracaos] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ConfiguracaoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createConfiguracaosRepository(supabase)
  const service = createConfiguracaosService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setConfiguracaos(data)
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
    configuracaos,
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function useConfiguracao(id: string) {
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createConfiguracaosRepository(supabase)
  const service = createConfiguracaosService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setConfiguracao(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { configuracao, loading, error }
}

export function useConfiguracaosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createConfiguracaosRepository(supabase)
  const service = createConfiguracaosService(repository)

  const criar = useCallback(async (data: ConfiguracaoFormData) => {
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

  const atualizar = useCallback(async (id: string, data: Partial<ConfiguracaoFormData>) => {
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
