import type { SupabaseClient } from '@supabase/supabase-js'

/** Reserva usando compare-and-swap: só vence quem ainda encontra o valor lido. */
export async function reservarNumeroNFCe(supabase: SupabaseClient, configId: string): Promise<number> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data: config, error } = await supabase.from('bar_config_nfce')
      .select('proximo_numero').eq('id', configId).eq('ativo', true).single()
    if (error || !config) throw new Error('Não foi possível consultar a numeração NFC-e')
    const anterior = config.proximo_numero
    const numero = anterior ?? 1
    if (!Number.isInteger(numero) || numero < 1 || numero > 999999999) {
      throw new Error('Numeração NFC-e inválida ou esgotada')
    }
    let query = supabase.from('bar_config_nfce').update({ proximo_numero: numero + 1 })
      .eq('id', configId).eq('ativo', true)
    query = anterior === null ? query.is('proximo_numero', null) : query.eq('proximo_numero', anterior)
    const { data: reservada, error: erroReserva } = await query.select('id').maybeSingle()
    if (erroReserva) throw new Error('Não foi possível reservar a numeração NFC-e')
    if (reservada) return numero
  }
  throw new Error('Numeração NFC-e ocupada. Tente novamente.')
}
