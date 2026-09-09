import { reservarNumeroNFCe } from '@/lib/nfce-numero'

function banco(inicial: number | null) {
  let atual = inicial
  const client = { from: () => {
    let update: number | undefined
    let esperado: number | null | undefined
    const query: any = {
      select: () => query,
      update: (v: any) => { update = v.proximo_numero; return query },
      eq: (k: string, v: any) => { if (k === 'proximo_numero') esperado = v; return query },
      is: (_k: string, v: null) => { esperado = v; return query },
      single: async () => ({ data: { proximo_numero: atual }, error: null }),
      maybeSingle: async () => {
        if (atual !== esperado) return { data: null, error: null }
        atual = update!
        return { data: { id: 'config' }, error: null }
      }
    }
    return query
  } }
  return client as any
}

test('reservas concorrentes recebem números distintos', async () => {
  const client = banco(10)
  const numeros = await Promise.all([reservarNumeroNFCe(client, 'config'), reservarNumeroNFCe(client, 'config')])
  expect(numeros.sort()).toEqual([10, 11])
})
test('inicia contador nulo em 1', async () => {
  expect(await reservarNumeroNFCe(banco(null), 'config')).toBe(1)
})
test('rejeita numeração inválida', async () => {
  await expect(reservarNumeroNFCe(banco(0), 'config')).rejects.toThrow('inválida')
})
