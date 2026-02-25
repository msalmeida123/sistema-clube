'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { barProdutosRepository, barCategoriasRepository, barPedidosRepository, carteirinhaRepository, barCaixaRepository, barConfigNFCeRepository } from '../repositories/bar.repository'
import { barService } from '../services/bar.service'
import type { BarProduto, BarCategoria, ItemCarrinho, CriarPedidoPayload, RecargaCarteirinhaPayload, BarPedidoFiltros, BarConfigNFCeFormData } from '../types'
import { useToast } from '@/hooks/use-toast'

// ── HOOK: PRODUTOS E CATEGORIAS (PDV) ─────────────────────────
export function useBarProdutos(apenasAtivos = true) {
  const { data: categorias = [], isLoading: loadingCats } = useQuery({
    queryKey: ['bar-categorias'],
    queryFn: () => barCategoriasRepository.listar()
  })

  const { data: produtos = [], isLoading: loadingProd } = useQuery({
    queryKey: ['bar-produtos', apenasAtivos],
    queryFn: () => barProdutosRepository.listar(apenasAtivos)
  })

  return { categorias, produtos, isLoading: loadingCats || loadingProd }
}

// ── HOOK: CARRINHO (estado local PDV) ─────────────────────────
export function useCarrinho() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])

  const adicionarItem = useCallback((produto: BarProduto, quantidade = 1) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.produto.id === produto.id)
      if (existente) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade, subtotal: (item.quantidade + quantidade) * item.preco_unitario }
            : item
        )
      }
      return [...prev, {
        produto,
        quantidade,
        preco_unitario: produto.preco,
        subtotal: produto.preco * quantidade
      }]
    })
  }, [])

  const removerItem = useCallback((produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
  }, [])

  const alterarQuantidade = useCallback((produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
      return
    }
    setCarrinho(prev =>
      prev.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade, subtotal: quantidade * item.preco_unitario }
          : item
      )
    )
  }, [])

  const limparCarrinho = useCallback(() => setCarrinho([]), [])

  const subtotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0)

  return { carrinho, adicionarItem, removerItem, alterarQuantidade, limparCarrinho, subtotal }
}

// ── HOOK: FINALIZAR VENDA ─────────────────────────────────────
export function useFinalizarVenda() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ payload, operadorId }: { payload: CriarPedidoPayload; operadorId: string }) => {
      return barService.finalizarVenda(payload, operadorId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['carteirinha-saldo'] })
      toast({ title: 'Venda finalizada!', description: 'Pedido registrado com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao finalizar venda', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: PEDIDOS ─────────────────────────────────────────────
export function useBarPedidos(filtros?: BarPedidoFiltros) {
  return useQuery({
    queryKey: ['bar-pedidos', filtros],
    queryFn: () => barPedidosRepository.listar(filtros)
  })
}

// ── HOOK: SALDO CARTEIRINHA ───────────────────────────────────
export function useCarteirinhaSaldo(associadoId?: string) {
  return useQuery({
    queryKey: ['carteirinha-saldo', associadoId],
    queryFn: () => associadoId ? carteirinhaRepository.buscarSaldo(associadoId) : null,
    enabled: !!associadoId
  })
}

// ── HOOK: RECARGA CARTEIRINHA ─────────────────────────────────
export function useRecarregarCarteirinha() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ payload, operadorId }: { payload: RecargaCarteirinhaPayload; operadorId: string }) => {
      return barService.recarregarCarteirinha(payload, operadorId)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['carteirinha-saldo', vars.payload.associado_id] })
      queryClient.invalidateQueries({ queryKey: ['carteirinha-movimentos'] })
      toast({ title: 'Recarga realizada!', description: 'Crédito adicionado à carteirinha.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro na recarga', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: MOVIMENTOS CARTEIRINHA ──────────────────────────────
export function useCarteirinhaMovimentos(associadoId?: string) {
  return useQuery({
    queryKey: ['carteirinha-movimentos', associadoId],
    queryFn: () => carteirinhaRepository.listarMovimentos(associadoId)
  })
}

// ── HOOK: CAIXA ─────────────────────────────────────────
export function useCaixaAberto() {
  return useQuery({
    queryKey: ['bar-caixa-aberto'],
    queryFn: () => barCaixaRepository.buscarAberto()
  })
}

export function useCaixas() {
  return useQuery({
    queryKey: ['bar-caixas'],
    queryFn: () => barCaixaRepository.listar()
  })
}

export function useCaixaMovimentos(caixaId?: string) {
  return useQuery({
    queryKey: ['bar-caixa-movimentos', caixaId],
    queryFn: () => caixaId ? barCaixaRepository.listarMovimentos(caixaId) : [],
    enabled: !!caixaId
  })
}

export function useAbrirCaixa() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ operadorId, operadorNome, saldoInicial, observacao }: { operadorId: string; operadorNome: string; saldoInicial: number; observacao?: string }) => {
      // Verifica se ja tem caixa aberto
      const aberto = await barCaixaRepository.buscarAberto()
      if (aberto) throw new Error('Já existe um caixa aberto. Feche-o antes de abrir outro.')
      return barCaixaRepository.abrir(operadorId, operadorNome, saldoInicial, observacao)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-caixa-aberto'] })
      queryClient.invalidateQueries({ queryKey: ['bar-caixas'] })
      toast({ title: 'Caixa aberto!', description: 'Pronto para registrar vendas.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao abrir caixa', description: err.message, variant: 'destructive' })
    }
  })
}

export function useFecharCaixa() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ caixaId, saldoConferido, observacao }: { caixaId: string; saldoConferido: number; observacao?: string }) => {
      return barCaixaRepository.fechar(caixaId, saldoConferido, observacao)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-caixa-aberto'] })
      queryClient.invalidateQueries({ queryKey: ['bar-caixas'] })
      toast({ title: 'Caixa fechado!', description: 'Resumo de vendas gerado.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao fechar caixa', description: err.message, variant: 'destructive' })
    }
  })
}

export function useMovimentoCaixa() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ caixaId, tipo, valor, motivo, operadorId }: { caixaId: string; tipo: string; valor: number; motivo: string; operadorId: string }) => {
      return barCaixaRepository.registrarMovimento(caixaId, tipo, valor, motivo, operadorId)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bar-caixa-movimentos', vars.caixaId] })
      toast({ title: vars.tipo === 'sangria' ? 'Sangria registrada' : 'Suprimento registrado' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: CONFIG NFC-e ───────────────────────────────────
export function useConfigNFCe() {
  return useQuery({
    queryKey: ['bar-config-nfce'],
    queryFn: () => barConfigNFCeRepository.buscar()
  })
}

export function useSalvarConfigNFCe() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BarConfigNFCeFormData) => {
      return barConfigNFCeRepository.salvar(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-config-nfce'] })
      toast({ title: 'Configuração salva!', description: 'Configurações de NFC-e atualizadas.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: EMITIR NFC-e (via ACBrMonitor TCP) ─────────────────
export function useEmitirNFCe() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pedidoId, cpfCnpj }: { pedidoId: string; cpfCnpj?: string }) => {
      // Chama API Route que conecta via TCP Socket ao ACBrMonitor
      const res = await fetch('/api/bar/nfce/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedidoId, cpf_cnpj: cpfCnpj })
      })
      const data = await res.json()
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || 'Erro ao emitir NFC-e')
      }
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bar-pedidos'] })
      toast({
        title: 'NFC-e emitida!',
        description: `Chave: ${data.chave_acesso?.substring(0, 25)}... | Protocolo: ${data.protocolo || '-'}`
      })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro NFC-e', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: CANCELAR NFC-e (via ACBrMonitor TCP) ────────────────
export function useCancelarNFCe() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nfceId, justificativa }: { nfceId: string; justificativa: string }) => {
      const res = await fetch('/api/bar/nfce/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfce_id: nfceId, justificativa })
      })
      const data = await res.json()
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || 'Erro ao cancelar NFC-e')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bar-pedidos'] })
      toast({ title: 'NFC-e cancelada', description: 'Nota fiscal cancelada com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao cancelar', description: err.message, variant: 'destructive' })
    }
  })
}

// ── HOOK: STATUS ACBrMonitor ──────────────────────────────────
export function useStatusACBr() {
  return useQuery({
    queryKey: ['acbr-status'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/bar/nfce/emitir?acao=status')
        const data = await res.json()
        return { conectado: data.status === 'conectado', mensagem: data.resposta || data.mensagem || data.status }
      } catch {
        return { conectado: false, mensagem: 'Erro de conexão' }
      }
    },
    refetchInterval: 60000, // Verifica a cada 60s
    staleTime: 30000
  })
}
