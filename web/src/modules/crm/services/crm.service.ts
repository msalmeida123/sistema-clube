// Service CRM - Responsável APENAS por lógica de negócio
import type { 
  Contato, ContatoFilters, ContatoFormData,
  Mensagem, MensagemFilters,
  RespostaAutomatica,
  ConfiguracaoBot,
  CRMStats
} from '../types'
import { CRMRepository } from '../repositories/crm.repository'

export class CRMService {
  constructor(private repository: CRMRepository) {}

  // ===== CONTATOS =====

  async listarContatos(filters?: ContatoFilters): Promise<Contato[]> {
    return this.repository.findContatos(filters)
  }

  async buscarContato(id: string): Promise<Contato | null> {
    return this.repository.findContatoById(id)
  }

  async buscarOuCriarContato(telefone: string, nome?: string): Promise<Contato> {
    const telefoneLimpo = telefone.replace(/\D/g, '')
    
    // Buscar existente
    let contato = await this.repository.findContatoByTelefone(telefoneLimpo)
    
    if (!contato) {
      // Criar novo
      contato = await this.repository.createContato({
        nome: nome || `+${telefoneLimpo}`,
        telefone: telefoneLimpo,
        status: 'novo'
      })
    }

    return contato
  }

  async criarContato(data: ContatoFormData): Promise<Contato> {
    // Validar telefone
    const telefoneLimpo = data.telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10) {
      throw new Error('Telefone inválido')
    }

    // Verificar duplicado
    const existente = await this.repository.findContatoByTelefone(telefoneLimpo)
    if (existente) {
      throw new Error('Contato já cadastrado com este telefone')
    }

    return this.repository.createContato(data)
  }

  async atualizarContato(id: string, data: Partial<ContatoFormData>): Promise<Contato> {
    return this.repository.updateContato(id, data)
  }

  async iniciarAtendimento(id: string): Promise<Contato> {
    return this.repository.updateContato(id, { status: 'em_atendimento' })
  }

  async finalizarAtendimento(id: string): Promise<Contato> {
    return this.repository.updateContato(id, { status: 'finalizado' })
  }

  async excluirContato(id: string): Promise<void> {
    return this.repository.deleteContato(id)
  }

  // ===== MENSAGENS =====

  async listarMensagens(contato_id: string): Promise<Mensagem[]> {
    return this.repository.findMensagens({ contato_id })
  }

  async enviarMensagem(
    contato_id: string,
    conteudo: string,
    usuario_id?: string,
    tipo: Mensagem['tipo'] = 'texto'
  ): Promise<Mensagem> {
    // Validar
    if (!conteudo?.trim()) {
      throw new Error('Mensagem não pode estar vazia')
    }

    const mensagem = await this.repository.createMensagem({
      contato_id,
      tipo,
      conteudo,
      direcao: 'saida',
      enviada_por: usuario_id,
      status: 'pendente'
    })

    // TODO: Integrar com WaSenderAPI para envio real
    // await this.enviarViaWhatsApp(contato_id, conteudo)

    return mensagem
  }

  async receberMensagem(
    telefone: string,
    conteudo: string,
    nome?: string,
    tipo: Mensagem['tipo'] = 'texto',
    media_url?: string
  ): Promise<{ contato: Contato; mensagem: Mensagem; resposta?: string }> {
    // Buscar ou criar contato
    const contato = await this.buscarOuCriarContato(telefone, nome)

    // Salvar mensagem
    const mensagem = await this.repository.createMensagem({
      contato_id: contato.id,
      tipo,
      conteudo,
      media_url,
      direcao: 'entrada',
      status: 'entregue'
    })

    // Verificar resposta automática
    const resposta = await this.buscarRespostaAutomatica(conteudo)

    return { contato, mensagem, resposta }
  }

  async marcarComoLida(id: string): Promise<void> {
    await this.repository.updateMensagemStatus(id, 'lida')
  }

  // ===== RESPOSTAS AUTOMÁTICAS =====

  async listarRespostasAutomaticas(): Promise<RespostaAutomatica[]> {
    return this.repository.findRespostasAutomaticas()
  }

  async buscarRespostaAutomatica(mensagem: string): Promise<string | undefined> {
    const respostas = await this.repository.findRespostasAtivas()
    const msgLower = mensagem.toLowerCase().trim()

    for (const resposta of respostas) {
      let match = false

      switch (resposta.tipo_gatilho) {
        case 'exato':
          match = msgLower === resposta.gatilho.toLowerCase()
          break
        case 'contem':
          match = msgLower.includes(resposta.gatilho.toLowerCase())
          break
        case 'regex':
          try {
            const regex = new RegExp(resposta.gatilho, 'i')
            match = regex.test(msgLower)
          } catch {
            match = false
          }
          break
      }

      if (match) {
        return resposta.resposta
      }
    }

    return undefined
  }

  async criarRespostaAutomatica(data: Partial<RespostaAutomatica>): Promise<RespostaAutomatica> {
    if (!data.gatilho?.trim()) {
      throw new Error('Gatilho é obrigatório')
    }

    if (!data.resposta?.trim()) {
      throw new Error('Resposta é obrigatória')
    }

    return this.repository.createRespostaAutomatica({
      ...data,
      ativo: data.ativo ?? true,
      prioridade: data.prioridade ?? 100
    })
  }

  async atualizarRespostaAutomatica(id: string, data: Partial<RespostaAutomatica>): Promise<RespostaAutomatica> {
    return this.repository.updateRespostaAutomatica(id, data)
  }

  async excluirRespostaAutomatica(id: string): Promise<void> {
    return this.repository.deleteRespostaAutomatica(id)
  }

  // ===== CONFIGURAÇÃO BOT =====

  async obterConfiguracaoBot(): Promise<ConfiguracaoBot | null> {
    return this.repository.getConfiguracaoBot()
  }

  async atualizarConfiguracaoBot(data: Partial<ConfiguracaoBot>): Promise<ConfiguracaoBot> {
    return this.repository.updateConfiguracaoBot(data)
  }

  async verificarHorarioAtendimento(): Promise<boolean> {
    const config = await this.repository.getConfiguracaoBot()
    
    if (!config?.ativo) return false
    if (!config.horario_inicio || !config.horario_fim) return true

    const agora = new Date()
    const hora = agora.getHours()
    const minuto = agora.getMinutes()
    const horaAtual = hora * 60 + minuto

    const [inicioH, inicioM] = config.horario_inicio.split(':').map(Number)
    const [fimH, fimM] = config.horario_fim.split(':').map(Number)
    const inicio = inicioH * 60 + inicioM
    const fim = fimH * 60 + fimM

    // Verificar dia da semana
    const diaSemana = agora.getDay()
    if (config.dias_semana && !config.dias_semana.includes(diaSemana)) {
      return false
    }

    return horaAtual >= inicio && horaAtual <= fim
  }

  // ===== ESTATÍSTICAS =====

  async obterEstatisticas(): Promise<CRMStats> {
    return this.repository.getStats()
  }
}

export const createCRMService = (repository: CRMRepository) => {
  return new CRMService(repository)
}

// Manter compatibilidade
export { CRMService as ContatosService, createCRMService as createContatosService }
