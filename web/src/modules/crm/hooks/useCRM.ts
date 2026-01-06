// Hook CRM - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createCRMRepository } from '../repositories/crm.repository'
import { createCRMService } from '../services/crm.service'
import type { 
  Contato, ContatoFilters, ContatoFormData,
  Mensagem,
  RespostaAutomatica,
  ConfiguracaoBot,
  CRMStats
} from '../types'

// Hook para lista de contatos - COM REALTIME
export function useContatos(initialFilters?: ContatoFilters) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContatoFilters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarContatos(filters)
      setContatos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    carregar()

    // Realtime para atualizações de conversas
    const channel = supabase
      .channel('conversas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas_whatsapp'
        },
        (payload) => {
          console.log('Mudança em conversas:', payload)
          carregar()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [carregar, supabase])

  const buscar = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const filtrarPorStatus = useCallback((status: Contato['status'] | undefined) => {
    setFilters(prev => ({ ...prev, status }))
  }, [])

  return {
    contatos,
    loading,
    error,
    filters,
    buscar,
    filtrarPorStatus,
    recarregar: carregar,
  }
}

// Hook para conversa (mensagens de um contato) - COM REALTIME
export function useConversa(contatoId: string) {
  const [contato, setContato] = useState<Contato | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  const carregar = useCallback(async () => {
    if (!contatoId) return
    
    setLoading(true)
    setError(null)
    try {
      const [contatoData, mensagensData] = await Promise.all([
        service.buscarContato(contatoId),
        service.listarMensagens(contatoId)
      ])
      setContato(contatoData)
      setMensagens(mensagensData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conversa')
    } finally {
      setLoading(false)
    }
  }, [contatoId])

  useEffect(() => {
    if (!contatoId) return

    carregar()

    // Configurar Realtime para novas mensagens
    const channel = supabase
      .channel(`mensagens-${contatoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp',
          filter: `conversa_id=eq.${contatoId}`
        },
        (payload) => {
          console.log('Nova mensagem realtime:', payload)
          const novaMensagem = payload.new as Mensagem
          setMensagens(prev => {
            // Evitar duplicatas
            if (prev.some(m => m.id === novaMensagem.id)) {
              return prev
            }
            return [...prev, novaMensagem]
          })
        }
      )
      .subscribe()

    // Polling como fallback (a cada 30s)
    const interval = setInterval(carregar, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [contatoId, supabase])

  const enviar = useCallback(async (conteudo: string, usuarioId?: string) => {
    try {
      const novaMensagem = await service.enviarMensagem(contatoId, conteudo, usuarioId)
      setMensagens(prev => [...prev, novaMensagem])
      return novaMensagem
    } catch (err) {
      throw err
    }
  }, [contatoId])

  return {
    contato,
    mensagens,
    loading,
    error,
    enviar,
    recarregar: carregar,
  }
}

// Hook para mutations de contatos
export function useContatosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  const criar = useCallback(async (data: ContatoFormData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.criarContato(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar contato'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<ContatoFormData>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.atualizarContato(id, data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar contato'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const iniciarAtendimento = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.iniciarAtendimento(id)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar atendimento'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const finalizarAtendimento = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await service.finalizarAtendimento(id)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar atendimento'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.excluirContato(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir contato'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    criar,
    atualizar,
    iniciarAtendimento,
    finalizarAtendimento,
    excluir,
    loading,
    error,
  }
}

// Hook para respostas automáticas
export function useRespostasAutomaticas() {
  const [respostas, setRespostas] = useState<RespostaAutomatica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarRespostasAutomaticas()
      setRespostas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar respostas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const criar = useCallback(async (data: Partial<RespostaAutomatica>) => {
    const result = await service.criarRespostaAutomatica(data)
    await carregar()
    return result
  }, [carregar])

  const atualizar = useCallback(async (id: string, data: Partial<RespostaAutomatica>) => {
    const result = await service.atualizarRespostaAutomatica(id, data)
    await carregar()
    return result
  }, [carregar])

  const excluir = useCallback(async (id: string) => {
    await service.excluirRespostaAutomatica(id)
    await carregar()
  }, [carregar])

  return {
    respostas,
    loading,
    error,
    criar,
    atualizar,
    excluir,
    recarregar: carregar,
  }
}

// Hook para configuração do bot
export function useConfiguracaoBot() {
  const [config, setConfig] = useState<ConfiguracaoBot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await service.obterConfiguracaoBot()
        setConfig(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configuração')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  const atualizar = useCallback(async (data: Partial<ConfiguracaoBot>) => {
    try {
      const result = await service.atualizarConfiguracaoBot(data)
      setConfig(result)
      return result
    } catch (err) {
      throw err
    }
  }, [])

  return { config, loading, error, atualizar }
}

// Hook para estatísticas do CRM
export function useCRMStats() {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createCRMRepository(supabase)
  const service = createCRMService(repository)

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await service.obterEstatisticas()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  return { stats, loading, error }
}

// Alias para compatibilidade
export { useContatos as useContato }
export { useContatosMutations as useMensagens }
