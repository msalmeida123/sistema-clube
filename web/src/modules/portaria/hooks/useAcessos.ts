// Hooks de Acesso
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAcessosRepository } from '../repositories/acessos.repository'
import { createAcessosService } from '../services/acessos.service'
import type { Acesso, AcessoFilters, AcessoFormData } from '../types'

export function useAcessos(initialFilters?: AcessoFilters) {
  const [acessos, setAcessos] = useState<Acesso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AcessoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createAcessosRepository(supabase)
  const service = createAcessosService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setAcessos(data)
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
    acessos,
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function useAcesso(id: string) {
  const [acesso, setAcesso] = useState<Acesso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAcessosRepository(supabase)
  const service = createAcessosService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setAcesso(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { acesso, loading, error }
}

export function useAcessosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAcessosRepository(supabase)
  const service = createAcessosService(repository)

  const criar = useCallback(async (data: AcessoFormData) => {
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

  const atualizar = useCallback(async (id: string, data: Partial<AcessoFormData>) => {
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
