// Hook Portaria - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createPortariaRepository } from '../repositories/portaria.repository'
import { createPortariaService } from '../services/portaria.service'
import type { 
  RegistroAcesso, 
  RegistroFilters, 
  LocalAcesso, 
  ValidacaoAcesso,
  PessoaAcesso,
  AcessoStats 
} from '../types'

export function usePortaria(local: LocalAcesso) {
  const [registros, setRegistros] = useState<RegistroAcesso[]>([])
  const [presentes, setPresentes] = useState<RegistroAcesso[]>([])
  const [stats, setStats] = useState<AcessoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createPortariaRepository(supabase)
  const service = createPortariaService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [registrosData, presentesData, statsData] = await Promise.all([
        service.listarRegistros({ local }),
        service.listarPresentes(local),
        service.obterEstatisticas(local)
      ])
      setRegistros(registrosData)
      setPresentes(presentesData)
      setStats({ ...statsData, acessos_semana: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [local])

  useEffect(() => {
    carregar()
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregar, 30000)
    return () => clearInterval(interval)
  }, [carregar])

  return {
    registros,
    presentes,
    stats,
    loading,
    error,
    recarregar: carregar,
  }
}

export function useValidacaoAcesso(local: LocalAcesso) {
  const [validacao, setValidacao] = useState<ValidacaoAcesso | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createPortariaRepository(supabase)
  const service = createPortariaService(repository)

  const validar = useCallback(async (qrcode: string) => {
    setLoading(true)
    setError(null)
    setValidacao(null)
    
    try {
      const resultado = await service.validarAcesso(qrcode, local)
      setValidacao(resultado)
      return resultado
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao validar acesso'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [local])

  const limpar = useCallback(() => {
    setValidacao(null)
    setError(null)
  }, [])

  return {
    validacao,
    loading,
    error,
    validar,
    limpar,
  }
}

export function useRegistroAcesso(local: LocalAcesso) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroAcesso | null>(null)

  const supabase = createClientComponentClient()
  const repository = createPortariaRepository(supabase)
  const service = createPortariaService(repository)

  const registrar = useCallback(async (
    pessoa: PessoaAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const registro = await service.registrarAcesso(pessoa, local, usuario_id, usuario_nome)
      setUltimoRegistro(registro)
      return registro
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar acesso'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [local])

  const registrarEntrada = useCallback(async (
    pessoa: PessoaAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const registro = await service.registrarEntrada(pessoa, local, usuario_id, usuario_nome)
      setUltimoRegistro(registro)
      return registro
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar entrada'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [local])

  const registrarSaida = useCallback(async (
    pessoa: PessoaAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const registro = await service.registrarSaida(pessoa, local, usuario_id, usuario_nome)
      setUltimoRegistro(registro)
      return registro
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar saída'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [local])

  return {
    registrar,
    registrarEntrada,
    registrarSaida,
    ultimoRegistro,
    loading,
    error,
  }
}
