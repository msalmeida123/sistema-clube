export type TipoPlano = 'individual' | 'familiar' | 'patrimonial'
export type TipoResidencia = 'casa' | 'apartamento'
export type StatusAssociado = 'ativo' | 'inativo' | 'suspenso' | 'expulso'
export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type TipoPagamento = 'boleto' | 'pix'
export type TipoCobranca = 'mensalidade_clube' | 'mensalidade_academia' | 'taxa_familiar'
export type SetorUsuario = 'admin' | 'presidente' | 'vice_presidente' | 'diretoria' | 'financeiro' | 'secretaria' | 'portaria_clube' | 'portaria_piscina' | 'portaria_academia' | 'atendimento'

export interface Associado {
  id: string
  numero_titulo: number
  nome: string
  cpf: string
  rg?: string
  titulo_eleitor?: string
  email?: string
  telefone?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  tipo_residencia?: TipoResidencia
  foto_url?: string
  plano: TipoPlano
  status: StatusAssociado
  data_associacao: string
  data_nascimento?: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  setor: SetorUsuario
  ativo: boolean
  associado_id?: string
}

export interface Database {
  public: {
    Tables: {
      associados: { Row: Associado }
      usuarios: { Row: Usuario }
    }
  }
}
