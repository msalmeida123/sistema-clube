import {
  barCategoriasRepository,
  barProdutosRepository,
  barPedidosRepository,
  carteirinhaRepository,
  barNFCeRepository,
  barConfigNFCeRepository,
  barCaixaRepository
} from '../repositories/bar.repository'
import type {
  CriarPedidoPayload,
  RecargaCarteirinhaPayload,
  BarConfigNFCe,
  BarPedido,
  BarNFCe
} from '../types'

// ── PDV: CRIAR VENDA ──────────────────────────────────────────
export const barService = {

  async finalizarVenda(payload: CriarPedidoPayload, operadorId: string): Promise<BarPedido> {
    // 1. Verifica se tem pagamento via carteirinha
    const pagCarteirinha = payload.pagamentos.find(p => p.forma_pagamento === 'carteirinha')

    if (pagCarteirinha && payload.associado_id) {
      // Valida saldo antes de criar o pedido
      const saldo = await carteirinhaRepository.buscarSaldo(payload.associado_id)
      const saldoDisponivel = saldo?.saldo ?? 0
      if (saldoDisponivel < pagCarteirinha.valor) {
        throw new Error(`Saldo insuficiente na carteirinha. Disponível: R$ ${saldoDisponivel.toFixed(2)}`)
      }
    }

    // 2. Vincula ao caixa aberto (se existir)
    const caixaAberto = await barCaixaRepository.buscarAberto()
    if (caixaAberto) {
      ;(payload as any).caixa_id = caixaAberto.id
    }

    // 3. Cria pedido + itens + pagamentos no banco
    const pedido = await barPedidosRepository.criar(payload)

    // 4. Debita carteirinha se necessário
    if (pagCarteirinha && payload.associado_id) {
      await carteirinhaRepository.debitar(
        payload.associado_id,
        pagCarteirinha.valor,
        pedido.id,
        operadorId
      )
    }

    return pedido
  },

  // ── RECARGA CARTEIRINHA ──────────────────────────────────────
  async recarregarCarteirinha(payload: RecargaCarteirinhaPayload, operadorId: string) {
    if (payload.valor <= 0) throw new Error('Valor de recarga deve ser maior que zero')
    return carteirinhaRepository.recarregar(
      payload.associado_id,
      payload.valor,
      payload.forma_recarga,
      operadorId,
      payload.descricao
    )
  },

  // ── EMITIR NFC-e VIA ACBrMonitor ─────────────────────────────
  /**
   * Emite uma NFC-e para o pedido informado.
   * 
   * Fluxo:
   *  1. Valida configuração e pedido
   *  2. Cria registro pendente em bar_nfce
   *  3. Chama API Route /api/bar/nfce/emitir (que conecta via TCP Socket ao ACBrMonitor)
   *  4. ACBrMonitor monta XML, assina com certificado digital, envia à SEFAZ
   *  5. Resposta atualiza bar_nfce com chave, protocolo e status
   * 
   * O ACBrMonitor deve estar:
   *  - Instalado e rodando (Windows ou Docker com Wine)
   *  - Configurado para comunicação TCP/IP (porta 3434)
   *  - Com certificado digital A1 configurado
   *  - Com WebService da UF configurado
   *  - CSC/Token do contribuinte configurado na aba DFe
   */
  async emitirNFCe(pedidoId: string, cpfCnpjConsumidor?: string): Promise<BarNFCe> {
    const config = await barConfigNFCeRepository.buscar()
    if (!config?.ativo) throw new Error('NFC-e não configurada ou desativada. Configure em Bar > Config NFC-e')

    const pedido = await barPedidosRepository.buscarPorId(pedidoId)
    if (!pedido) throw new Error('Pedido não encontrado')
    if (pedido.status !== 'pago') throw new Error('Só é possível emitir NFC-e para pedidos pagos')

    // Verifica se já emitiu
    const nfceExistente = await barNFCeRepository.buscarPorPedido(pedidoId)
    if (nfceExistente?.status === 'autorizada') throw new Error('NFC-e já emitida para este pedido')

    // Cria registro pendente
    const nfce = nfceExistente ?? await barNFCeRepository.criar(pedidoId, cpfCnpjConsumidor)

    try {
      // Chama API Route que se conecta via TCP ao ACBrMonitor
      const response = await fetch('/api/bar/nfce/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          cpf_cnpj: cpfCnpjConsumidor,
          nfce_id: nfce.id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.sucesso) {
        throw new Error(result.erro || 'Erro ao emitir NFC-e')
      }

      return {
        ...nfce,
        status: 'autorizada',
        numero: result.numero,
        chave_acesso: result.chave_acesso,
        protocolo: result.protocolo
      }
    } catch (err: any) {
      throw new Error(err.message || 'Falha na comunicação com ACBrMonitor')
    }
  },

  // ── CANCELAR NFC-e VIA ACBrMonitor ───────────────────────────
  /**
   * Cancela uma NFC-e autorizada.
   * Prazo máximo: até 30 minutos após autorização (varia por UF).
   * Justificativa mínima: 15 caracteres.
   */
  async cancelarNFCe(nfceId: string, justificativa: string): Promise<void> {
    if (!justificativa || justificativa.length < 15) {
      throw new Error('Justificativa deve ter pelo menos 15 caracteres')
    }

    const response = await fetch('/api/bar/nfce/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfce_id: nfceId, justificativa })
    })

    const result = await response.json()

    if (!response.ok || !result.sucesso) {
      throw new Error(result.erro || 'Erro ao cancelar NFC-e')
    }
  },

  // ── VERIFICAR STATUS ACBrMonitor ─────────────────────────────
  async verificarStatusACBr(): Promise<{ conectado: boolean; mensagem: string }> {
    try {
      const response = await fetch('/api/bar/nfce/emitir?acao=status')
      const result = await response.json()
      return {
        conectado: result.status === 'conectado',
        mensagem: result.status === 'conectado' ? 'ACBrMonitor conectado' : result.mensagem || 'Desconectado'
      }
    } catch {
      return { conectado: false, mensagem: 'Erro ao verificar status' }
    }
  }
}

// Re-exports para conveniência
export {
  barCategoriasRepository as categoriasRepo,
  barProdutosRepository as produtosRepo,
  barPedidosRepository as pedidosRepo,
  carteirinhaRepository,
  barNFCeRepository,
  barConfigNFCeRepository
}
