// Hook Configurações
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createConfiguracoesRepository } from '../repositories/configuracoes.repository'
import { createConfiguracoesService } from '../services/configuracoes.service'
import type { ConfiguracaoClube, Plano, Quiosque, SicoobConfig, WaSenderConfig } from '../types'

export function useConfiguracao() {
  const [config, setConfig] = useState<ConfiguracaoClube | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createConfiguracoesService(createConfiguracoesRepository(supabase))

  useEffect(() => {
    service.obterConfiguracao().then(setConfig).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const atualizar = useCallback(async (data: Partial<ConfiguracaoClube>) => {
    setLoading(true)
    try {
      const updated = await service.atualizarConfiguracao(data)
      setConfig(updated)
      return updated
    } finally {
      setLoading(false)
    }
  }, [])

  const configurarSicoob = useCallback(async (config: SicoobConfig) => {
    return service.configurarSicoob(config).then(setConfig)
  }, [])

  const configurarWaSender = useCallback(async (config: WaSenderConfig) => {
    return service.configurarWaSender(config).then(setConfig)
  }, [])

  return { config, loading, error, atualizar, configurarSicoob, configurarWaSender }
}

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createConfiguracoesService(createConfiguracoesRepository(supabase))

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listarPlanos()
      setPlanos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const criar = useCallback(async (data: Partial<Plano>) => {
    const result = await service.criarPlano(data)
    await carregar()
    return result
  }, [carregar])

  const atualizar = useCallback(async (id: string, data: Partial<Plano>) => {
    const result = await service.atualizarPlano(id, data)
    await carregar()
    return result
  }, [carregar])

  const excluir = useCallback(async (id: string) => {
    await service.excluirPlano(id)
    await carregar()
  }, [carregar])

  return { planos, loading, error, criar, atualizar, excluir, recarregar: carregar }
}

export function useQuiosques() {
  const [quiosques, setQuiosques] = useState<Quiosque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const service = createConfiguracoesService(createConfiguracoesRepository(supabase))

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.listarQuiosques()
      setQuiosques(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const criar = useCallback(async (data: Partial<Quiosque>) => {
    const result = await service.criarQuiosque(data)
    await carregar()
    return result
  }, [carregar])

  const atualizar = useCallback(async (id: string, data: Partial<Quiosque>) => {
    const result = await service.atualizarQuiosque(id, data)
    await carregar()
    return result
  }, [carregar])

  const excluir = useCallback(async (id: string) => {
    await service.excluirQuiosque(id)
    await carregar()
  }, [carregar])

  return { quiosques, loading, error, criar, atualizar, excluir, recarregar: carregar }
}
