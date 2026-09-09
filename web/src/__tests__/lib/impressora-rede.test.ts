/** @jest-environment node */
import { createServer } from 'node:net'
import { validarImpressora, bytesComanda, enviarBytes, ConfigImpressora } from '@/lib/impressora-rede'
const config: ConfigImpressora = { nome:'Cozinha', ip:'192.168.1.150', porta:9100, colunas:32, protocolo:'texto', cortar:false, ativo:true }
test('aceita impressora privada e configuração desativada sem IP', () => {
  expect(validarImpressora(config).ip).toBe(config.ip)
  expect(validarImpressora({...config,ip:'',ativo:false}).ativo).toBe(false)
})
test.each(['127.0.0.1','169.254.169.254','8.8.8.8','localhost','192.168.001.1','::1',''])('rejeita destino inválido %s', ip => expect(()=>validarImpressora({...config,ip})).toThrow())
test('rejeita porta que não usa o protocolo suportado', () => expect(()=>validarImpressora({...config,porta:80})).toThrow())
test('comanda filtra bebidas, quebra linhas e remove comandos injetados', () => {
  const text = bytesComanda(config, { numero_pedido:12, mesa:'3',cliente_nome:'João\x1b@',created_at:'2026-09-07T15:00:00Z',bar_itens_pedido:[{enviar_cozinha:true,produto_nome:'Pizza\x1dV',quantidade:2},{enviar_cozinha:false,produto_nome:'Suco',quantidade:1}] }, true).toString('ascii')
  expect(text).toContain('REIMPRESSAO')
  expect(text).toContain('Joao')
  expect(text).not.toContain('Suco')
  expect(text).not.toMatch(/[\x1b\x1d]/)
  expect(text.split('\n').every(l=>l.length<=32)).toBe(true)
})
test('ESC/POS só envia inicialização e corte quando configurado', () => {
  const bytes = bytesComanda({...config,protocolo:'escpos',cortar:true})
  expect(Array.from(bytes.subarray(0,2))).toEqual([27,64])
  expect(Array.from(bytes.subarray(-3))).toEqual([29,86,0])
})
test('envia o conteúdo completo para um receptor TCP simulado', async () => {
  const recebidos: Buffer[] = []
  let concluir!: () => void
  const recebido = new Promise<void>(resolve=>{concluir=resolve})
  const server = createServer(socket=> {socket.on('data',data=>recebidos.push(data));socket.on('end',()=>{socket.end();concluir()})})
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
  try {
    const address = server.address() as {port:number}
    const bytes = bytesComanda(config)
    await enviarBytes('127.0.0.1',address.port,bytes)
    await recebido
    expect(Buffer.concat(recebidos)).toEqual(bytes)
  } finally { await new Promise<void>(resolve=>server.close(()=>resolve())) }
})
