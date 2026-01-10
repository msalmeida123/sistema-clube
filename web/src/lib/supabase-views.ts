import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Tipos das views
export interface KPIs {
  associados_ativos: number
  dependentes_ativos: number
  conversas_abertas: number
  mensalidades_atrasadas: number
  valor_inadimplencia: number
  acessos_hoje: number
  quiosques_reservados_hoje: number
  armarios_em_uso: number
}

export interface DashboardConversas {
  total_conversas: number
  novos: number
  aguardando: number
  em_atendimento: number
  resolvidos: number
  arquivados: number
  prioridade_alta: number
  prioridade_media: number
  prioridade_baixa: number
  hoje: number
  ultimos_7_dias: number
  ultimos_30_dias: number
}

export interface AlertaConversa {
  id: string
  nome_contato: string
  telefone: string
  status: string
  prioridade: string
  setor: string
  ultimo_contato: string
  horas_parado: number
  nivel_alerta: 'critico' | 'alerta' | 'atencao' | 'ok'
  alerta_descricao: string
}

export interface ConversaPorSetor {
  setor_id: string
  setor_nome: string
  setor_cor: string
  total: number
  novos: number
  aguardando: number
  em_atendimento: number
  resolvidos: number
  urgentes: number
  ultima_atividade: string
}

export interface DashboardAssociados {
  total_associados: number
  ativos: number
  inativos: number
  suspensos: number
  expulsos: number
  novos_30_dias: number
  novos_7_dias: number
  titulos_quitados: number
  titulos_pendentes: number
}

export interface DashboardFinanceiro {
  total_mensalidades: number
  pendentes: number
  pagas: number
  atrasadas: number
  canceladas: number
  valor_pendente: number
  valor_recebido: number
  valor_atrasado: number
  vencendo_7_dias: number
  vencidas: number
}

export interface AssociadoInadimplente {
  associado_id: string
  numero_titulo: number
  nome: string
  telefone: string
  email: string
  status: string
  categoria: string
  qtd_mensalidades_atrasadas: number
  valor_total_devido: number
  mensalidade_mais_antiga: string
  dias_atraso_max: number
  nivel_inadimplencia: 'critico' | 'grave' | 'moderado' | 'leve'
}

export interface RankingAtendente {
  usuario_id: string
  atendente: string
  total_conversas: number
  resolvidas: number
  em_andamento: number
  total_mensagens_enviadas: number
  taxa_resolucao: number
}

export interface MetricaDiaSemana {
  dia_semana_num: number
  dia_semana: string
  total_mensagens: number
  conversas_ativas: number
}

export interface MetricaPorHora {
  hora: number
  total_mensagens: number
  recebidas: number
  enviadas: number
  pct_recebidas: number
}

// Funções de acesso às views
export async function getKPIs(): Promise<KPIs | null> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_kpis_sistema')
    .select('*')
    .single()
  
  if (error) {
    console.error('Erro ao buscar KPIs:', error)
    return null
  }
  return data
}

export async function getDashboardConversas(): Promise<DashboardConversas | null> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_dashboard_conversas')
    .select('*')
    .single()
  
  if (error) {
    console.error('Erro ao buscar dashboard conversas:', error)
    return null
  }
  return data
}

export async function getAlertasConversas(limite = 10): Promise<AlertaConversa[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_alertas_conversas')
    .select('*')
    .in('nivel_alerta', ['critico', 'alerta', 'atencao'])
    .order('horas_parado', { ascending: false })
    .limit(limite)
  
  if (error) {
    console.error('Erro ao buscar alertas:', error)
    return []
  }
  return data || []
}

export async function getConversasPorSetor(): Promise<ConversaPorSetor[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_conversas_por_setor')
    .select('*')
  
  if (error) {
    console.error('Erro ao buscar conversas por setor:', error)
    return []
  }
  return data || []
}

export async function getDashboardAssociados(): Promise<DashboardAssociados | null> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_dashboard_associados')
    .select('*')
    .single()
  
  if (error) {
    console.error('Erro ao buscar dashboard associados:', error)
    return null
  }
  return data
}

export async function getDashboardFinanceiro(): Promise<DashboardFinanceiro | null> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_dashboard_financeiro')
    .select('*')
    .single()
  
  if (error) {
    console.error('Erro ao buscar dashboard financeiro:', error)
    return null
  }
  return data
}

export async function getInadimplentes(limite = 50): Promise<AssociadoInadimplente[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_associados_inadimplentes')
    .select('*')
    .order('dias_atraso_max', { ascending: false })
    .limit(limite)
  
  if (error) {
    console.error('Erro ao buscar inadimplentes:', error)
    return []
  }
  return data || []
}

export async function getRankingAtendentes(): Promise<RankingAtendente[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_ranking_atendentes')
    .select('*')
    .order('total_conversas', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar ranking atendentes:', error)
    return []
  }
  return data || []
}

export async function getMetricasDiaSemana(): Promise<MetricaDiaSemana[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_metricas_dia_semana')
    .select('*')
    .order('dia_semana_num')
  
  if (error) {
    console.error('Erro ao buscar métricas por dia:', error)
    return []
  }
  return data || []
}

export async function getMetricasPorHora(): Promise<MetricaPorHora[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('vw_metricas_por_hora')
    .select('*')
    .order('hora')
  
  if (error) {
    console.error('Erro ao buscar métricas por hora:', error)
    return []
  }
  return data || []
}
