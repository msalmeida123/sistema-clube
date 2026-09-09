import { Socket, isIP } from 'node:net'

export interface ConfigImpressora {
  nome: string; ip: string; porta: number; colunas: number
  protocolo: 'texto' | 'escpos'; cortar: boolean; ativo: boolean
}

export function validarImpressora(value: any): ConfigImpressora {
  const ip = typeof value?.ip === 'string' ? value.ip.trim() : ''
  const partes = ip.split('.').map(Number)
  const privado = isIP(ip) === 4 && (partes[0] === 10 || (partes[0] === 192 && partes[1] === 168) || (partes[0] === 172 && partes[1] >= 16 && partes[1] <= 31))
  if (ip && !privado) throw new Error('Informe um IPv4 da rede local, como 192.168.1.150')
  if (value?.ativo && !ip) throw new Error('Informe o IP antes de ativar')
  if (!Number.isInteger(value?.porta) || value.porta < 9100 || value.porta > 9109) throw new Error('Porta RAW TCP deve estar entre 9100 e 9109')
  if (![32, 48].includes(value?.colunas)) throw new Error('Selecione a largura do papel')
  if (!['texto', 'escpos'].includes(value?.protocolo)) throw new Error('Protocolo inválido')
  if (typeof value?.ativo !== 'boolean' || typeof value?.cortar !== 'boolean') throw new Error('Configuração inválida')
  return { nome: String(value.nome || 'Cozinha').trim().slice(0,60), ip, porta: value.porta, colunas: value.colunas, protocolo: value.protocolo, cortar: value.cortar, ativo: value.ativo }
}

// Texto do pedido nunca pode introduzir comandos de controle na impressora.
export function textoImpressora(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ')
}

export function bytesComanda(config: ConfigImpressora, pedido?: any, reimpressao = false): Buffer {
  const linhas: string[] = ['COZINHA', reimpressao ? '*** REIMPRESSAO ***' : '']
  if (!pedido) linhas.push('TESTE DE IMPRESSAO', config.nome, 'Se voce le esta mensagem, o teste chegou.')
  else {
    const itens = (pedido.bar_itens_pedido || []).filter((i: any) => i.enviar_cozinha === true)
    if (!itens.length) throw new Error('Pedido sem itens para a cozinha')
    if (itens.length > 200) throw new Error('Pedido excede o limite de itens da comanda')
    linhas.push(`Pedido #${pedido.numero_pedido}`, `Mesa: ${pedido.mesa || 'Balcao'}`, `Cliente: ${pedido.cliente_nome || 'Consumidor final'}`,
      new Date(pedido.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), '-'.repeat(config.colunas))
    itens.forEach((i: any) => linhas.push(`${Number(i.quantidade)}x ${String(i.produto_nome).slice(0,200)}`))
    if (pedido.observacao) linhas.push('-'.repeat(config.colunas), `Obs: ${String(pedido.observacao).slice(0,500)}`)
    linhas.push('COMANDA DE PREPARO - NAO FISCAL')
  }
  const texto = linhas.flatMap(linha => textoImpressora(linha).match(new RegExp(`.{1,${config.colunas}}`, 'g')) || ['']).join('\n') + '\n\n\n\n'
  return Buffer.concat([config.protocolo === 'escpos' ? Buffer.from([27,64]) : Buffer.alloc(0), Buffer.from(texto,'ascii'), config.protocolo === 'escpos' && config.cortar ? Buffer.from([29,86,0]) : Buffer.alloc(0)])
}

export function enviarBytes(ip: string, porta: number, bytes: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket()
    let concluido = false
    const terminar = (error?: Error) => {
      if (concluido) return
      concluido = true
      clearTimeout(prazo)
      socket.destroy()
      error ? reject(error) : resolve()
    }
    const prazo = setTimeout(() => terminar(new Error('Tempo esgotado. Confira a impressora antes de reenviar.')), 7000)
    socket.once('error', () => terminar(new Error('Falha de conexão. Confira IP, porta e a impressora antes de reenviar.')))
    socket.once('close', () => { if (!concluido) terminar(new Error('Conexão encerrada antes de concluir o envio.')) })
    socket.connect(porta, ip, () => socket.end(bytes, () => terminar()))
  })
}
