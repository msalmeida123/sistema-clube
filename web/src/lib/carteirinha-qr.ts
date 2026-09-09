export function codigoCarteirinha(id: string, qrCode?: string | null, dependente = false) {
  return qrCode?.trim() || `${dependente ? 'DEP' : 'SOCIO'}-${id}`
}
export function idCarteirinha(codigo: string, prefixo: 'SOCIO' | 'DEP') {
  const match = codigo.match(new RegExp(`^${prefixo}-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`, 'i'))
  return match?.[1] ?? null
}
export function buscaNumerica(codigo: string) {
  return /^\d+$/.test(codigo) ? codigo : null
}
