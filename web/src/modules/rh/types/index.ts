// Tipos do módulo de RH (Recursos Humanos)

// ==================== FUNCIONÁRIOS ====================

export type StatusFuncionario = 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
export type TipoContrato = 'clt' | 'pj' | 'estagiario' | 'temporario' | 'freelancer'
export type Turno = 'manha' | 'tarde' | 'noite' | 'integral' | 'escala'

export interface Funcionario {
  id: string
  nome: string
  cpf: string
  rg?: string
  data_nascimento?: string
  sexo?: 'M' | 'F'
  estado_civil?: string
  email?: string
  telefone?: string
  celular?: string
  foto_url?: string

  // Endereço
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string

  // Dados profissionais
  cargo: string
  departamento: string
  tipo_contrato: TipoContrato
  data_admissao: string
  data_demissao?: string
  salario: number
  turno: Turno
  carga_horaria_semanal: number
  status: StatusFuncionario

  // Dados bancários
  banco?: string
  agencia?: string
  conta?: string
  tipo_conta?: 'corrente' | 'poupanca' | 'pix'
  chave_pix?: string

  // Documentos trabalhistas
  ctps_numero?: string
  ctps_serie?: string
  pis?: string

  created_at: string
  updated_at?: string
}

export interface FuncionarioFilters {
  search?: string
  status?: StatusFuncionario
  departamento?: string
  tipo_contrato?: TipoContrato
  limit?: number
  offset?: number
}

export interface FuncionarioFormData {
  nome: string
  cpf: string
  cargo: string
  departamento: string
  tipo_contrato: TipoContrato
  data_admissao: string
  salario: number
  turno: Turno
  carga_horaria_semanal: number
  status?: StatusFuncionario
  email?: string
  telefone?: string
  celular?: string
  data_nascimento?: string
  sexo?: 'M' | 'F'
  estado_civil?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  banco?: string
  agencia?: string
  conta?: string
  tipo_conta?: 'corrente' | 'poupanca' | 'pix'
  chave_pix?: string
  ctps_numero?: string
  ctps_serie?: string
  pis?: string
}

// ==================== CONTROLE DE PONTO ====================

export type TipoRegistroPonto = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida'

export interface RegistroPonto {
  id: string
  funcionario_id: string
  data: string
  tipo: TipoRegistroPonto
  hora: string
  observacao?: string
  registrado_por?: string
  created_at: string
  funcionario?: { nome: string; cargo: string }
}

export interface PontoDiario {
  id: string
  funcionario_id: string
  data: string
  entrada?: string
  saida_almoco?: string
  retorno_almoco?: string
  saida?: string
  horas_trabalhadas?: number
  horas_extras?: number
  atraso_minutos?: number
  falta: boolean
  justificativa?: string
  abonado: boolean
  created_at: string
  updated_at?: string
  funcionario?: { nome: string; cargo: string; departamento: string }
}

export interface PontoFilters {
  funcionario_id?: string
  data_inicio?: string
  data_fim?: string
  falta?: boolean
  limit?: number
}

export interface ResumoPonto {
  funcionario_id: string
  nome: string
  dias_trabalhados: number
  total_horas: number
  horas_extras: number
  faltas: number
  atrasos: number
}

// ==================== FOLHA DE PAGAMENTO ====================

export type StatusFolha = 'rascunho' | 'calculada' | 'aprovada' | 'paga' | 'cancelada'

export interface FolhaPagamento {
  id: string
  funcionario_id: string
  referencia: string // YYYY-MM
  
  // Proventos
  salario_base: number
  horas_extras_valor: number
  adicional_noturno: number
  adicional_insalubridade: number
  adicional_periculosidade: number
  gratificacao: number
  comissao: number
  outros_proventos: number
  total_proventos: number

  // Descontos
  inss: number
  irrf: number
  vale_transporte: number
  vale_refeicao: number
  faltas_desconto: number
  atrasos_desconto: number
  adiantamento: number
  outros_descontos: number
  total_descontos: number

  // Líquido
  salario_liquido: number

  // Controle
  status: StatusFolha
  data_pagamento?: string
  observacao?: string

  created_at: string
  updated_at?: string
  funcionario?: { nome: string; cargo: string; departamento: string; banco?: string; agencia?: string; conta?: string; chave_pix?: string }
}

export interface FolhaFilters {
  funcionario_id?: string
  referencia?: string
  status?: StatusFolha
  limit?: number
}

export interface FolhaFormData {
  funcionario_id: string
  referencia: string
  salario_base: number
  horas_extras_valor?: number
  adicional_noturno?: number
  adicional_insalubridade?: number
  adicional_periculosidade?: number
  gratificacao?: number
  comissao?: number
  outros_proventos?: number
  inss?: number
  irrf?: number
  vale_transporte?: number
  vale_refeicao?: number
  faltas_desconto?: number
  atrasos_desconto?: number
  adiantamento?: number
  outros_descontos?: number
  observacao?: string
}

// ==================== FÉRIAS E AFASTAMENTOS ====================

export type TipoAfastamento = 'ferias' | 'licenca_medica' | 'licenca_maternidade' | 'licenca_paternidade' | 'afastamento_inss' | 'falta_justificada' | 'falta_injustificada' | 'folga' | 'outro'
export type StatusAfastamento = 'solicitado' | 'aprovado' | 'em_andamento' | 'concluido' | 'rejeitado' | 'cancelado'

export interface Afastamento {
  id: string
  funcionario_id: string
  tipo: TipoAfastamento
  data_inicio: string
  data_fim: string
  dias_totais: number
  motivo?: string
  documento_url?: string
  status: StatusAfastamento
  aprovado_por?: string
  data_aprovacao?: string
  observacao?: string
  created_at: string
  updated_at?: string
  funcionario?: { nome: string; cargo: string; departamento: string }
}

export interface AfastamentoFilters {
  funcionario_id?: string
  tipo?: TipoAfastamento
  status?: StatusAfastamento
  data_inicio?: string
  data_fim?: string
  limit?: number
}

export interface AfastamentoFormData {
  funcionario_id: string
  tipo: TipoAfastamento
  data_inicio: string
  data_fim: string
  motivo?: string
  observacao?: string
}

// ==================== ESTATÍSTICAS ====================

export interface RHStats {
  total_funcionarios: number
  ativos: number
  inativos: number
  em_ferias: number
  afastados: number
  total_folha_mes: number
  departamentos: { nome: string; quantidade: number }[]
}

// ==================== DEPARTAMENTOS ====================

export const DEPARTAMENTOS = [
  'Administração',
  'Financeiro',
  'Portaria',
  'Manutenção',
  'Limpeza',
  'Cozinha/Bar',
  'Esportes',
  'Piscina',
  'Academia',
  'Segurança',
  'Eventos',
  'Outro'
] as const
