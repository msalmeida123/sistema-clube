/** Usa o cliente autenticado: as políticas do banco preservam o isolamento do clube. */
export async function listarConvitesFinanceiro(db: any) {
  const { data, error } = await db.from('convites')
    .select('id,associado_id,nome_convidado,valor_pago,data_visita,status,associado:associados(nome,numero_titulo)')
    .in('status', ['ativo', 'pago', 'utilizado'])
    .order('data_visita', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function convitesFinanceiroMes(db: any, inicio: string, fim: string) {
  const { data, error } = await db.from('convites')
    .select('valor_pago,status')
    .gte('data_visita', inicio)
    .lte('data_visita', fim)
    .in('status', ['ativo', 'pago', 'utilizado'])
  if (error) throw error
  return data || []
}
