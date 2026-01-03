// Hooks de Dependentes
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createDependentesRepository } from '../repositories/dependentes.repository'
import { createDependentesService } from '../services/dependentes.service'
import type { Dependente, DependenteFilters, DependenteFormData } from '../types'

export function useDependentes(initialFilters?: DependenteFilters) {
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DependenteFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createDependentesRepository(supabase)
  const service = createDependentesService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setDependentes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dependentes')
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

  const filtrarPorAssociado = useCallback((associado_id: string | undefined) => {
    setFilters(prev => ({ ...prev, associado_id }))
  }, [])

  return {
    dependentes,
    loading,
    error,
    filters,
    buscar,
    filtrarPorAssociado,
    recarregar: carregar,
  }
}

export function useDependente(id: string) {
  const [dependente, setDependente] = useState<Dependente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createDependentesRepository(supabase)
  const service = createDependentesService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setDependente(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dependente')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { dependente, loading, error }
}

export function useDependentesMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createDependentesRepository(supabase)
  const service = createDependentesService(repository)

  const criar = useCallback(async (data: DependenteFormData) => {
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

  const atualizar = useCallback(async (id: string, data: Partial<DependenteFormData>) => {
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
