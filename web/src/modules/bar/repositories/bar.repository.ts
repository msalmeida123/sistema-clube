import { createClient } from '@/lib/supabase/client'
import type {
  BarCategoria, BarCategoriaFormData,
  BarProduto, BarProdutoFormData,
  BarPedido, CriarPedidoPayload,
  CarteirinhaSaldo, CarteirinhaMovimento,
  BarNFCe, BarConfigNFCe, BarConfigNFCeFormData,
  BarPedidoFiltros,
  BarCaixa, BarCaixaMovimento
} from '../types'

const supabase = createClient()

// ── CATEGORIAS ────────────────────────────────────────────────
export const barCategoriasRepository = {
  async listar(): Promise<BarCategoria[]> {
    const { data, error } = await supabase
      .from('bar_categorias')
      .select('*')
      .order('ordem', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async criar(payload: BarCategoriaFormData): Promise<BarCategoria> {
    const { data, error } = await supabase
      .from('bar_categorias')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, payload: Partial<BarCategoriaFormData>): Promise<BarCategoria> {
    const { data, error } = await supabase
      .from('bar_categorias')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('bar_categorias')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ── PRODUTOS ──────────────────────────────────────────────────
export const barProdutosRepository = {
  async listar(apenasAtivos = false): Promise<BarProduto[]> {
    let query = supabase
      .from('bar_produtos')
      .select(`*, bar_categorias(nome)`)
      .order('nome', { ascending: true })

    if (apenasAtivos) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((p: any) => ({
      ...p,
      categoria_nome: p.bar_categorias?.nome
    }))
  },

  async listarPorCategoria(categoriaId: string): Promise<BarProduto[]> {
    const { data, error } = await supabase
      .from('bar_produtos')
      .select(`*, bar_categorias(nome)`)
      .eq('categoria_id', categoriaId)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    return (data ?? []).map((p: any) => ({ ...p, categoria_nome: p.bar_categorias?.nome }))
  },

  async criar(payload: BarProdutoFormData): Promise<BarProduto> {
    const { data, error } = await supabase
      .from('bar_produtos')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, payload: Partial<BarProdutoFormData>): Promise<BarProduto> {
    const { data, error } = await supabase
      .from('bar_produtos')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('bar_produtos')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ── PEDIDOS ───────────────────────────────────────────────────
export const barPedidosRepository = {
  async listar(filtros?: BarPedidoFiltros): Promise<BarPedido[]> {
    let query = supabase
      .from('bar_pedidos')
      .select(`
        *,
        associados(nome),
        bar_itens_pedido(*),
        bar_pagamentos(*)
      `)
      .order('created_at', { ascending: false })

    if (filtros?.status) query = query.eq('status', filtros.status)
    if (filtros?.associado_id) query = query.eq('associado_id', filtros.associado_id)
    if (filtros?.data_inicio) query = query.gte('created_at', filtros.data_inicio)
    if (filtros?.data_fim) query = query.lte('created_at', filtros.data_fim + 'T23:59:59')

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((p: any) => ({
      ...p,
      associado_nome: p.associados?.nome,
      itens: p.bar_itens_pedido ?? [],
      pagamentos: p.bar_pagamentos ?? []
    }))
  },

  async buscarPorId(id: string): Promise<BarPedido | null> {
    const { data, error } = await supabase
      .from('bar_pedidos')
      .select(`
        *,
        associados(nome),
        bar_itens_pedido(*),
        bar_pagamentos(*)
      `)
      .eq('id', id)
      .single()
    if (error) return null
    return {
      ...data,
      associado_nome: (data as any).associados?.nome,
      itens: (data as any).bar_itens_pedido ?? [],
      pagamentos: (data as any).bar_pagamentos ?? []
    }
  },

  async criar(payload: CriarPedidoPayload): Promise<BarPedido> {
    const { data: pedido, error: pedidoError } = await supabase
      .from('bar_pedidos')
      .insert({
        associado_id: payload.associado_id || null,
        subtotal: payload.subtotal,
        desconto: payload.desconto,
        total: payload.total,
        observacao: payload.observacao,
        mesa: payload.mesa,
        status: 'pago',
        pago_em: new Date().toISOString()
      })
      .select()
      .single()
    if (pedidoError) throw pedidoError

    // Itens
    const itens = payload.itens.map(item => ({ ...item, pedido_id: pedido.id }))
    const { error: itensError } = await supabase.from('bar_itens_pedido').insert(itens)
    if (itensError) throw itensError

    // Pagamentos
    const pagamentos = payload.pagamentos.map(p => ({ ...p, pedido_id: pedido.id }))
    const { error: pagError } = await supabase.from('bar_pagamentos').insert(pagamentos)
    if (pagError) throw pagError

    return pedido
  },

  async cancelar(id: string): Promise<void> {
    const { error } = await supabase
      .from('bar_pedidos')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}

// ── CARTEIRINHA ───────────────────────────────────────────────
export const carteirinhaRepository = {
  async buscarSaldo(associadoId: string): Promise<CarteirinhaSaldo | null> {
    const { data, error } = await supabase
      .from('carteirinha_saldo')
      .select('*')
      .eq('associado_id', associadoId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async recarregar(associadoId: string, valor: number, formaRecarga: string, operadorId: string, descricao?: string): Promise<CarteirinhaSaldo> {
    // Busca ou cria saldo
    let saldoAtual = 0
    const existente = await this.buscarSaldo(associadoId)
    if (existente) {
      saldoAtual = existente.saldo
    } else {
      await supabase.from('carteirinha_saldo').insert({ associado_id: associadoId, saldo: 0 })
    }

    const novoSaldo = saldoAtual + valor

    const { data, error } = await supabase
      .from('carteirinha_saldo')
      .upsert({ associado_id: associadoId, saldo: novoSaldo, updated_at: new Date().toISOString() }, { onConflict: 'associado_id' })
      .select()
      .single()
    if (error) throw error

    // Registra movimento
    await supabase.from('carteirinha_movimentos').insert({
      associado_id: associadoId,
      tipo: 'credito',
      valor,
      saldo_anterior: saldoAtual,
      saldo_posterior: novoSaldo,
      descricao: descricao || `Recarga via ${formaRecarga}`,
      operador_id: operadorId,
      forma_recarga: formaRecarga
    })

    return data
  },

  async debitar(associadoId: string, valor: number, pedidoId: string, operadorId: string): Promise<void> {
    const existente = await this.buscarSaldo(associadoId)
    if (!existente) throw new Error('Carteirinha sem saldo cadastrado')
    if (existente.saldo < valor) throw new Error(`Saldo insuficiente. Disponível: R$ ${existente.saldo.toFixed(2)}`)

    const novoSaldo = existente.saldo - valor

    const { error } = await supabase
      .from('carteirinha_saldo')
      .update({ saldo: novoSaldo, updated_at: new Date().toISOString() })
      .eq('associado_id', associadoId)
    if (error) throw error

    await supabase.from('carteirinha_movimentos').insert({
      associado_id: associadoId,
      tipo: 'debito',
      valor,
      saldo_anterior: existente.saldo,
      saldo_posterior: novoSaldo,
      descricao: `Consumo no bar - pedido`,
      pedido_id: pedidoId,
      operador_id: operadorId
    })
  },

  async listarMovimentos(associadoId?: string, limite = 50): Promise<CarteirinhaMovimento[]> {
    let query = supabase
      .from('carteirinha_movimentos')
      .select(`*, associados(nome)`)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (associadoId) query = query.eq('associado_id', associadoId)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((m: any) => ({ ...m, associado_nome: m.associados?.nome }))
  }
}

// ── NFC-e ─────────────────────────────────────────────────────
export const barNFCeRepository = {
  async buscarPorPedido(pedidoId: string): Promise<BarNFCe | null> {
    const { data } = await supabase
      .from('bar_nfce')
      .select('*')
      .eq('pedido_id', pedidoId)
      .maybeSingle()
    return data
  },

  async criar(pedidoId: string, cpfCnpjConsumidor?: string): Promise<BarNFCe> {
    const { data, error } = await supabase
      .from('bar_nfce')
      .insert({ pedido_id: pedidoId, status: 'pendente', cpf_cnpj_consumidor: cpfCnpjConsumidor })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, payload: Partial<BarNFCe>): Promise<void> {
    const { error } = await supabase
      .from('bar_nfce')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}

// ── CAIXA ─────────────────────────────────────────────────────
export const barCaixaRepository = {
  async buscarAberto(operadorId?: string): Promise<BarCaixa | null> {
    let query = supabase
      .from('bar_caixas')
      .select('*')
      .eq('status', 'aberto')
      .order('aberto_em', { ascending: false })
      .limit(1)

    if (operadorId) query = query.eq('operador_id', operadorId)

    const { data } = await query.maybeSingle()
    return data
  },

  async abrir(operadorId: string, operadorNome: string, saldoInicial: number, observacao?: string): Promise<BarCaixa> {
    const { data, error } = await supabase
      .from('bar_caixas')
      .insert({
        operador_id: operadorId,
        operador_nome: operadorNome,
        saldo_inicial: saldoInicial,
        observacao_abertura: observacao,
        status: 'aberto'
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async fechar(caixaId: string, saldoConferido: number, observacao?: string): Promise<BarCaixa> {
    // Calcula totais dos pedidos vinculados ao caixa
    const { data: pagamentos } = await supabase
      .from('bar_pagamentos')
      .select('forma_pagamento, valor, troco, bar_pedidos!inner(caixa_id, status)')
      .eq('bar_pedidos.caixa_id', caixaId)
      .eq('bar_pedidos.status', 'pago')

    let totalVendas = 0, totalDinheiro = 0, totalCartaoCredito = 0, totalCartaoDebito = 0
    let totalPix = 0, totalCarteirinha = 0, totalCortesia = 0, totalTroco = 0

    for (const p of pagamentos ?? []) {
      totalVendas += Number(p.valor)
      totalTroco += Number(p.troco ?? 0)
      switch (p.forma_pagamento) {
        case 'dinheiro': totalDinheiro += Number(p.valor); break
        case 'cartao_credito': totalCartaoCredito += Number(p.valor); break
        case 'cartao_debito': totalCartaoDebito += Number(p.valor); break
        case 'pix': totalPix += Number(p.valor); break
        case 'carteirinha': totalCarteirinha += Number(p.valor); break
        case 'cortesia': totalCortesia += Number(p.valor); break
      }
    }

    // Busca sangrias/suprimentos
    const { data: movimentos } = await supabase
      .from('bar_caixa_movimentos')
      .select('tipo, valor')
      .eq('caixa_id', caixaId)

    let totalSangrias = 0, totalSuprimentos = 0
    for (const m of movimentos ?? []) {
      if (m.tipo === 'sangria') totalSangrias += Number(m.valor)
      else totalSuprimentos += Number(m.valor)
    }

    // Busca saldo inicial
    const { data: caixaAtual } = await supabase.from('bar_caixas').select('saldo_inicial').eq('id', caixaId).single()
    const saldoInicial = Number(caixaAtual?.saldo_inicial ?? 0)
    const saldoFinal = saldoInicial + totalDinheiro - totalTroco + totalSuprimentos - totalSangrias
    const diferenca = saldoConferido - saldoFinal

    const { data, error } = await supabase
      .from('bar_caixas')
      .update({
        status: 'fechado',
        total_vendas: totalVendas,
        total_dinheiro: totalDinheiro,
        total_cartao_credito: totalCartaoCredito,
        total_cartao_debito: totalCartaoDebito,
        total_pix: totalPix,
        total_carteirinha: totalCarteirinha,
        total_cortesia: totalCortesia,
        total_troco: totalTroco,
        total_sangrias: totalSangrias,
        total_suprimentos: totalSuprimentos,
        saldo_final: saldoFinal,
        saldo_conferido: saldoConferido,
        diferenca,
        observacao_fechamento: observacao,
        fechado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', caixaId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listar(limite = 20): Promise<BarCaixa[]> {
    const { data, error } = await supabase
      .from('bar_caixas')
      .select('*')
      .order('aberto_em', { ascending: false })
      .limit(limite)
    if (error) throw error
    return data ?? []
  },

  async buscarPorId(id: string): Promise<BarCaixa | null> {
    const { data } = await supabase.from('bar_caixas').select('*').eq('id', id).maybeSingle()
    return data
  },

  async registrarMovimento(caixaId: string, tipo: string, valor: number, motivo: string, operadorId: string): Promise<BarCaixaMovimento> {
    const { data, error } = await supabase
      .from('bar_caixa_movimentos')
      .insert({ caixa_id: caixaId, tipo, valor, motivo, operador_id: operadorId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listarMovimentos(caixaId: string): Promise<BarCaixaMovimento[]> {
    const { data, error } = await supabase
      .from('bar_caixa_movimentos')
      .select('*')
      .eq('caixa_id', caixaId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
}

// ── CONFIG NFC-e ──────────────────────────────────────────────
export const barConfigNFCeRepository = {
  async buscar(): Promise<BarConfigNFCe | null> {
    const { data } = await supabase
      .from('bar_config_nfce')
      .select('*')
      .maybeSingle()
    return data
  },

  async salvar(payload: BarConfigNFCeFormData): Promise<BarConfigNFCe> {
    const existente = await this.buscar()
    if (existente) {
      const { data, error } = await supabase
        .from('bar_config_nfce')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('bar_config_nfce')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    }
  }
}
