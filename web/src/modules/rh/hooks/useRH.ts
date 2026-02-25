// Hook - Responsável APENAS por gerenciar estado React do módulo RH
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRHRepository } from '../repositories/rh.repository'
import { createRHService } from '../services/rh.service'
import type {
  Funcionario, FuncionarioFilters, FuncionarioFormData,
  PontoDiario, PontoFilters,
  FolhaPagamento, FolhaFilters, FolhaFormData,
  Afastamento, AfastamentoFilters, AfastamentoFormData,
  RHStats
} from '../types'

// Helper para criar service
function useRHService() {
  const supabase = createClientComponentClient()
  const repository = createRHRepository(supabase)
  const service = createRHService(repository)
  return service
}

// ==================== FUNCIONÁRIOS ====================

export function useFuncionarios(initialFilters?: FuncionarioFilters) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FuncionarioFilters>(initialFilters || {})

  const service = useRHService()

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarFuncionarios(filters)
      setFuncionarios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { carregar() }, [carregar])

  const buscar = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const filtrarPorStatus = useCallback((status: Funcionario['status'] | undefined) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  const filtrarPorDepartamento = useCallback((departamento: string | undefined) => {
    setFilters(prev => ({ ...prev, departamento }))
  }, [])

  return {
    funcionarios,
    loading,
    error,
    filters,
    buscar,
    filtrarPorStatus,
    filtrarPorDepartamento,
    recarregar: carregar,
  }
}

export function useFuncionario(id: string) {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await service.buscarFuncionarioPorId(id)
        setFuncionario(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar funcionário')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { funcionario, loading, error }
}

export function useFuncionarioMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  const criar = useCallback(async (data: FuncionarioFormData) => {
    setLoading(true)
    setError(null)
    try {
      return await service.criarFuncionario(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar funcionário'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<FuncionarioFormData>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.atualizarFuncionario(id, data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar funcionário'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const desligar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await service.desligarFuncionario(id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desligar funcionário'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.excluirFuncionario(id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir funcionário'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { criar, atualizar, desligar, excluir, loading, error }
}

// ==================== CONTROLE DE PONTO ====================

export function usePonto(filters?: PontoFilters) {
  const [pontos, setPontos] = useState<PontoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarPontos(filters)
      setPontos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pontos')
    } finally {
      setLoading(false)
    }
  }, [filters?.funcionario_id, filters?.data_inicio, filters?.data_fim])

  useEffect(() => { carregar() }, [carregar])

  const registrar = useCallback(async (
    funcionario_id: string,
    data: string,
    campo: 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida',
    hora: string
  ) => {
    try {
      await service.registrarPonto(funcionario_id, data, campo, hora)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar ponto')
      throw err
    }
  }, [carregar])

  const marcarFalta = useCallback(async (funcionario_id: string, data: string, justificativa?: string) => {
    try {
      await service.marcarFalta(funcionario_id, data, justificativa)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar falta')
      throw err
    }
  }, [carregar])

  const abonarFalta = useCallback(async (id: string) => {
    try {
      await service.abonarFalta(id)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abonar falta')
      throw err
    }
  }, [carregar])

  return { pontos, loading, error, registrar, marcarFalta, abonarFalta, recarregar: carregar }
}

// ==================== FOLHA DE PAGAMENTO ====================

export function useFolhaPagamento(filters?: FolhaFilters) {
  const [folhas, setFolhas] = useState<FolhaPagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarFolhas(filters)
      setFolhas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar folhas')
    } finally {
      setLoading(false)
    }
  }, [filters?.referencia, filters?.status, filters?.funcionario_id])

  useEffect(() => { carregar() }, [carregar])

  const gerarFolhaMensal = useCallback(async (referencia: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.gerarFolhaMensal(referencia)
      await carregar()
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar folha'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [carregar])

  const aprovar = useCallback(async (id: string) => {
    try {
      await service.aprovarFolha(id)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar folha')
      throw err
    }
  }, [carregar])

  const marcarComoPaga = useCallback(async (id: string) => {
    try {
      await service.marcarFolhaComoPaga(id)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pagar folha')
      throw err
    }
  }, [carregar])

  return { folhas, loading, error, gerarFolhaMensal, aprovar, marcarComoPaga, recarregar: carregar }
}

// ==================== FÉRIAS E AFASTAMENTOS ====================

export function useAfastamentos(filters?: AfastamentoFilters) {
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarAfastamentos(filters)
      setAfastamentos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar afastamentos')
    } finally {
      setLoading(false)
    }
  }, [filters?.funcionario_id, filters?.tipo, filters?.status])

  useEffect(() => { carregar() }, [carregar])

  const criar = useCallback(async (data: AfastamentoFormData) => {
    try {
      const result = await service.criarAfastamento(data)
      await carregar()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar afastamento')
      throw err
    }
  }, [carregar])

  const aprovar = useCallback(async (id: string, aprovado_por: string) => {
    try {
      await service.aprovarAfastamento(id, aprovado_por)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar afastamento')
      throw err
    }
  }, [carregar])

  const rejeitar = useCallback(async (id: string, observacao?: string) => {
    try {
      await service.rejeitarAfastamento(id, observacao)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar afastamento')
      throw err
    }
  }, [carregar])

  const concluir = useCallback(async (id: string) => {
    try {
      await service.concluirAfastamento(id)
      await carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir afastamento')
      throw err
    }
  }, [carregar])

  return { afastamentos, loading, error, criar, aprovar, rejeitar, concluir, recarregar: carregar }
}

// ==================== ESTATÍSTICAS ====================

export function useRHStats() {
  const [stats, setStats] = useState<RHStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const service = useRHService()

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.obterEstatisticas()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  return { stats, loading, error, recarregar: carregar }
}
