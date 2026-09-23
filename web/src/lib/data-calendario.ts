/** Campos SQL DATE representam dias do calendário, não instantes em UTC. */
export function formatarDataCalendario(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : 'Não informado'
}
