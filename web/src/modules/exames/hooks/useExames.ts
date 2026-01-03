// Hook Exames Médicos
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createExamesRepository } from '../repositories/exames.repository'
import { createExamesService } from '../services/exames.service'
import type { ExameMedico, ExameFilters, ExameFormData, ExamesStats } from '../types'

export function useExames(initialFilters?: ExameFilters) {
  const [exames, setExames] = useState<ExameMedico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExameFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const service = createExamesService(createExamesRepository(supabase))

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listar(filters)
      setExames(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exames')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { carregar() }, [carregar])

  return { exames, loading, error, filters, setFilters, recarregar: carregar }
}

export function useExame(id: string) {
  const [exame, setExame] = useState<ExameMedico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createExamesService(createExamesRepository(supabase))

  useEffect(() => {
    if (!id) return
    setLoading(true)
    service.buscarPorId(id)
      .then(setExame)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return { exame, loading, error }
}

export function useExamesMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createExamesService(createExamesRepository(supabase))

  const executar = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    setError(null)
    try { return await fn() }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }

  return {
    criar: (data: ExameFormData) => executar(() => service.criar(data)),
    atualizar: (id: string, data: Partial<ExameFormData>) => executar(() => service.atualizar(id, data)),
    aprovar: (id: string, resultado?: string) => executar(() => service.aprovar(id, resultado)),
    reprovar: (id: string, motivo?: string) => executar(() => service.reprovar(id, motivo)),
    excluir: (id: string) => executar(() => service.excluir(id)),
    loading,
    error,
  }
}

export function useExamesStats() {
  const [stats, setStats] = useState<ExamesStats | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()
  const service = createExamesService(createExamesRepository(supabase))

  useEffect(() => {
    service.obterEstatisticas().then(setStats).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
