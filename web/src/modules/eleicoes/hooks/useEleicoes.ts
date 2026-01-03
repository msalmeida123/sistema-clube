// Hook Eleições
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createEleicoesRepository } from '../repositories/eleicoes.repository'
import { createEleicoesService } from '../services/eleicoes.service'
import type { Eleicao, EleicaoFilters, EleicaoFormData, Candidato, ResultadoEleicao } from '../types'

export function useEleicoes(initialFilters?: EleicaoFilters) {
  const [eleicoes, setEleicoes] = useState<Eleicao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EleicaoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createEleicoesRepository(supabase)
  const service = createEleicoesService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listar(filters)
      setEleicoes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eleições')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { carregar() }, [carregar])

  return { eleicoes, loading, error, filters, setFilters, recarregar: carregar }
}

export function useEleicao(id: string) {
  const [eleicao, setEleicao] = useState<Eleicao | null>(null)
  const [resultado, setResultado] = useState<ResultadoEleicao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createEleicoesRepository(supabase)
  const service = createEleicoesService(repository)

  useEffect(() => {
    const carregar = async () => {
      if (!id) return
      setLoading(true)
      try {
        const [eleicaoData, resultadoData] = await Promise.all([
          service.buscarPorId(id),
          service.obterResultado(id)
        ])
        setEleicao(eleicaoData)
        setResultado(resultadoData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar eleição')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  return { eleicao, resultado, loading, error }
}

export function useEleicoesMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createEleicoesRepository(supabase)
  const service = createEleicoesService(repository)

  const criar = useCallback(async (data: EleicaoFormData) => {
    setLoading(true)
    setError(null)
    try {
      return await service.criar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const iniciar = useCallback(async (id: string) => {
    setLoading(true)
    try { return await service.iniciar(id) }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }, [])

  const encerrar = useCallback(async (id: string) => {
    setLoading(true)
    try { return await service.encerrar(id) }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }, [])

  const adicionarCandidato = useCallback(async (eleicao_id: string, data: Partial<Candidato>) => {
    setLoading(true)
    try { return await service.adicionarCandidato(eleicao_id, data) }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }, [])

  const votar = useCallback(async (eleicao_id: string, associado_id: string, candidato_id?: string) => {
    setLoading(true)
    try { await service.votar(eleicao_id, associado_id, candidato_id) }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); throw err }
    finally { setLoading(false) }
  }, [])

  return { criar, iniciar, encerrar, adicionarCandidato, votar, loading, error }
}
