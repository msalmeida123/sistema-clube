import type { SupabaseClient } from '@supabase/supabase-js'
import { idCarteirinha } from '@/lib/carteirinha-qr'

// Consulta somente leitura; identificar a pessoa não registra nem aprova um exame.
export async function buscarAssociadoPorCarteirinha(supabase: SupabaseClient, entrada: string) {
  const codigo = entrada.trim()
  if (!codigo || codigo.length > 512) return null
  const campos = 'id,nome,cpf,numero_titulo,foto_url,status,qr_code'
  const resultado = await supabase.from('associados').select(campos).eq('qr_code', codigo).maybeSingle()
  if (resultado.error) throw resultado.error
  if (resultado.data) return resultado.data
  const id = idCarteirinha(codigo, 'SOCIO')
  if (!id) return null
  const fallback = await supabase.from('associados').select(campos).eq('id', id).maybeSingle()
  if (fallback.error) throw fallback.error
  return fallback.data && !fallback.data.qr_code?.trim() ? fallback.data : null
}
