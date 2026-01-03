// Hook Infrações
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createInfracoesRepository } from '../repositories/infracoes.repository'
import { createInfracoesService } from '../services/infracoes.service'
import type { Infracao, InfracaoFilters, InfracaoFormData, TipoPenalidade, InfracoesStats } from '../types'

export function useInfracoes(initialFilters?: InfracaoFilters) {
  const [infracoes, setInfracoes] = useState<Infracao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<InfracaoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const service = createInfracoesService(createInfracoesRepository(supabase))

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listar(filters)
      setInfracoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar infrações')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { carregar() }, [carregar])

  return { infracoes, loading, error, filters, setFilters, recarregar: carregar }
}

export function useInfracao(id: string) {
  const [infracao, setInfracao] = useState<Infracao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createInfracoesService(createInfracoesRepository(supabase))

  useEffect(() => {
    if (!id) return
    setLoading(true)
    service.buscarPorId(id).then(setInfracao).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [id])

  return { infracao, loading, error }
}

export function useInfracoesMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createInfracoesService(createInfracoesRepository(supabase))

  const executar = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true); setError(null)
    try { return await fn() }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }

  return {
    registrar: (data: InfracaoFormData, usuario?: string) => executar(() => service.registrar(data, usuario)),
    iniciarAnalise: (id: string) => executar(() => service.iniciarAnalise(id)),
    julgar: (id: string, pen: TipoPenalidade, parecer: string, opts?: { dias_suspensao?: number; valor_multa?: number }) => 
      executar(() => service.julgar(id, pen, parecer, opts)),
    arquivar: (id: string, motivo: string) => executar(() => service.arquivar(id, motivo)),
    excluir: (id: string) => executar(() => service.excluir(id)),
    loading, error,
  }
}

export function useInfracoesStats() {
  const [stats, setStats] = useState<InfracoesStats | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()
  const service = createInfracoesService(createInfracoesRepository(supabase))

  useEffect(() => {
    service.obterEstatisticas()
      .then(data => setStats({ ...data, por_gravidade: { leve: 0, media: 0, grave: 0, gravissima: 0 } }))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
