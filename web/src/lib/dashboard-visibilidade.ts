export const PAINEIS_DASHBOARD = [
  { id: 'associados', nome: 'Associados ativos', modulo: 'associados', grupo: 'Clube' },
  { id: 'dependentes', nome: 'Dependentes ativos', modulo: 'dependentes', grupo: 'Clube' },
  { id: 'acessos', nome: 'Acessos hoje', modulo: 'portaria', grupo: 'Clube' },
  { id: 'quiosques', nome: 'Quiosques reservados', modulo: 'configuracoes', grupo: 'Clube' },
  { id: 'armarios', nome: 'Armários em uso', modulo: 'portaria', grupo: 'Clube' },
  { id: 'mensalidades', nome: 'Mensalidades atrasadas', modulo: 'financeiro', grupo: 'Financeiro' },
  { id: 'inadimplencia', nome: 'Inadimplência', modulo: 'financeiro', grupo: 'Financeiro' },
  { id: 'financeiro', nome: 'Resumo financeiro', modulo: 'financeiro', grupo: 'Financeiro' },
  { id: 'conversas', nome: 'Conversas abertas', modulo: 'crm', grupo: 'CRM' },
  { id: 'alertas', nome: 'Conversas aguardando', modulo: 'crm', grupo: 'CRM' },
  { id: 'setores', nome: 'Conversas por setor', modulo: 'crm', grupo: 'CRM' },
  { id: 'metricas', nome: 'Métricas WhatsApp', modulo: 'crm', grupo: 'CRM' },
] as const

export type PainelDashboard = typeof PAINEIS_DASHBOARD[number]['id']
export const COLUNAS_KPI: Partial<Record<PainelDashboard,string>> = {
 associados:'associados_ativos', dependentes:'dependentes_ativos', acessos:'acessos_hoje',
 quiosques:'quiosques_reservados_hoje', armarios:'armarios_em_uso',
 mensalidades:'mensalidades_atrasadas', inadimplencia:'valor_inadimplencia', conversas:'conversas_abertas'
}

/** A configuração da empresa limita inclusive administradores. As permissões
 * pessoais podem restringir ainda mais, mas nunca habilitar um painel desativado. */
export function paineisPermitidos(habilitados: readonly string[], permissoes: readonly string[], admin: boolean): PainelDashboard[] {
  return PAINEIS_DASHBOARD.filter(p => habilitados.includes(p.id) && (admin || permissoes.includes(p.modulo))).map(p => p.id)
}
