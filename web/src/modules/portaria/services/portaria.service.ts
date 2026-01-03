// Service Portaria - Responsável APENAS por lógica de negócio
import type { 
  RegistroAcesso, 
  RegistroFilters, 
  LocalAcesso, 
  ValidacaoAcesso,
  PessoaAcesso 
} from '../types'
import { PortariaRepository } from '../repositories/portaria.repository'

export class PortariaService {
  constructor(private repository: PortariaRepository) {}

  // ===== VALIDAÇÃO DE ACESSO =====

  async validarAcesso(qrcode: string, local: LocalAcesso): Promise<ValidacaoAcesso> {
    const alertas: string[] = []

    // Tentar encontrar como associado
    let associado = await this.repository.findAssociadoByQRCode(qrcode)
    
    if (associado) {
      return this.validarAssociado(associado, local, alertas)
    }

    // Tentar encontrar como dependente
    const dependente = await this.repository.findDependenteByQRCode(qrcode)
    
    if (dependente) {
      return this.validarDependente(dependente, local, alertas)
    }

    return {
      permitido: false,
      motivo: 'QR Code não reconhecido'
    }
  }

  private async validarAssociado(
    associado: any, 
    local: LocalAcesso, 
    alertas: string[]
  ): Promise<ValidacaoAcesso> {
    const pessoa: PessoaAcesso = {
      id: associado.id,
      nome: associado.nome,
      foto_url: associado.foto_url,
      tipo: 'associado',
      status: associado.status,
      numero_titulo: associado.numero_titulo,
      pode_acessar: true
    }

    // Verificar status
    if (associado.status !== 'ativo') {
      return {
        permitido: false,
        pessoa,
        motivo: `Associado ${associado.status}`
      }
    }

    // Verificar adimplência
    const adimplente = await this.repository.checkAdimplencia(associado.id)
    pessoa.adimplente = adimplente
    
    if (!adimplente) {
      alertas.push('⚠️ Associado com mensalidades em atraso')
      // Dependendo da configuração, pode bloquear ou só alertar
      // return { permitido: false, pessoa, motivo: 'Inadimplente' }
    }

    // Verificar exame médico para academia/piscina
    if (local === 'academia' || local === 'piscina') {
      const exameValido = await this.repository.checkExameMedico(associado.id, 'associado')
      pessoa.exame_valido = exameValido
      
      if (!exameValido) {
        return {
          permitido: false,
          pessoa,
          motivo: 'Exame médico vencido ou não realizado',
          alertas
        }
      }
    }

    return {
      permitido: true,
      pessoa,
      alertas: alertas.length > 0 ? alertas : undefined
    }
  }

  private async validarDependente(
    dependente: any, 
    local: LocalAcesso, 
    alertas: string[]
  ): Promise<ValidacaoAcesso> {
    const titular = dependente.associados

    const pessoa: PessoaAcesso = {
      id: dependente.id,
      nome: dependente.nome,
      foto_url: dependente.foto_url,
      tipo: 'dependente',
      status: dependente.status,
      titular_id: titular?.id,
      titular_nome: titular?.nome,
      pode_acessar: true
    }

    // Verificar status do dependente
    if (dependente.status !== 'ativo') {
      return {
        permitido: false,
        pessoa,
        motivo: `Dependente ${dependente.status}`
      }
    }

    // Verificar status do titular
    if (titular?.status !== 'ativo') {
      return {
        permitido: false,
        pessoa,
        motivo: `Titular ${titular?.status || 'não encontrado'}`
      }
    }

    // Verificar adimplência do titular
    if (titular) {
      const adimplente = await this.repository.checkAdimplencia(titular.id)
      pessoa.adimplente = adimplente
      
      if (!adimplente) {
        alertas.push('⚠️ Titular com mensalidades em atraso')
      }
    }

    // Verificar exame médico para academia/piscina
    if (local === 'academia' || local === 'piscina') {
      const exameValido = await this.repository.checkExameMedico(dependente.id, 'dependente')
      pessoa.exame_valido = exameValido
      
      if (!exameValido) {
        return {
          permitido: false,
          pessoa,
          motivo: 'Exame médico vencido ou não realizado',
          alertas
        }
      }
    }

    return {
      permitido: true,
      pessoa,
      alertas: alertas.length > 0 ? alertas : undefined
    }
  }

  // ===== REGISTRO DE ACESSO =====

  async registrarAcesso(
    pessoa: PessoaAcesso,
    local: LocalAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ): Promise<RegistroAcesso> {
    // Determinar se é entrada ou saída
    const ultimoRegistro = await this.repository.getUltimoRegistro(pessoa.id, local)
    const tipo = ultimoRegistro?.tipo === 'entrada' ? 'saida' : 'entrada'

    return this.repository.createRegistro({
      pessoa_id: pessoa.id,
      pessoa_nome: pessoa.nome,
      pessoa_foto: pessoa.foto_url,
      tipo_pessoa: pessoa.tipo,
      tipo,
      local,
      usuario_id,
      usuario_nome
    })
  }

  async registrarEntrada(
    pessoa: PessoaAcesso,
    local: LocalAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ): Promise<RegistroAcesso> {
    return this.repository.createRegistro({
      pessoa_id: pessoa.id,
      pessoa_nome: pessoa.nome,
      pessoa_foto: pessoa.foto_url,
      tipo_pessoa: pessoa.tipo,
      tipo: 'entrada',
      local,
      usuario_id,
      usuario_nome
    })
  }

  async registrarSaida(
    pessoa: PessoaAcesso,
    local: LocalAcesso,
    usuario_id?: string,
    usuario_nome?: string
  ): Promise<RegistroAcesso> {
    return this.repository.createRegistro({
      pessoa_id: pessoa.id,
      pessoa_nome: pessoa.nome,
      pessoa_foto: pessoa.foto_url,
      tipo_pessoa: pessoa.tipo,
      tipo: 'saida',
      local,
      usuario_id,
      usuario_nome
    })
  }

  // ===== CONSULTAS =====

  async listarRegistros(filters?: RegistroFilters): Promise<RegistroAcesso[]> {
    return this.repository.findRegistros(filters)
  }

  async obterEstatisticas(local: LocalAcesso) {
    return this.repository.getStats(local)
  }

  async listarPresentes(local: LocalAcesso): Promise<RegistroAcesso[]> {
    const hoje = new Date().toISOString().split('T')[0]
    
    const registros = await this.repository.findRegistros({
      local,
      data_inicio: `${hoje}T00:00:00`
    })

    // Filtrar apenas os que estão presentes (última ação foi entrada)
    const pessoasMap = new Map<string, RegistroAcesso>()
    
    // Ordenar por data_hora descendente para pegar o último registro de cada pessoa
    registros.sort((a, b) => 
      new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
    )

    for (const registro of registros) {
      if (!pessoasMap.has(registro.pessoa_id)) {
        pessoasMap.set(registro.pessoa_id, registro)
      }
    }

    // Retornar apenas quem tem entrada como último registro
    return Array.from(pessoasMap.values())
      .filter(r => r.tipo === 'entrada')
  }
}

export const createPortariaService = (repository: PortariaRepository) => {
  return new PortariaService(repository)
}
