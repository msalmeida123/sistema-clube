// Hooks de Contato
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createContatosRepository } from '../repositories/contatos.repository'
import { createContatosService } from '../services/contatos.service'
import type { Contato, ContatoFilters, ContatoFormData } from '../types'

export function useContatos(initialFilters?: ContatoFilters) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContatoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createContatosRepository(supabase)
  const service = createContatosService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      setContatos(data)
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
    contatos,
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function useContato(id: string) {
  const [contato, setContato] = useState<Contato | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createContatosRepository(supabase)
  const service = createContatosService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        setContato(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { contato, loading, error }
}

export function useContatosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createContatosRepository(supabase)
  const service = createContatosService(repository)

  const criar = useCallback(async (data: ContatoFormData) => {
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

  const atualizar = useCallback(async (id: string, data: Partial<ContatoFormData>) => {
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
