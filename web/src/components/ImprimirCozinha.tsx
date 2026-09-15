'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {BotaoUSBLocal} from '@/components/ImpressaoUSBLocal'
import { Printer } from 'lucide-react'
import {lerCozinhaUSB} from '@/lib/cozinha-usb'

export function ImprimirCozinha({ pedidoId, reimpressao = false }: { pedidoId: string; reimpressao?: boolean }) {
  const [ocupado, setOcupado] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const chave = useRef<string | undefined>(undefined)
  const enviando = useRef(false)
  function imprimirUSB(){
    if(enviando.current)return
    if(reimpressao&&!window.confirm('Confira a cozinha antes de imprimir outra via. Continuar?'))return
    const config=lerCozinhaUSB()
    const w=window.open(`/api/bar/comprovante?pedido_id=${encodeURIComponent(pedidoId)}&via=cozinha&papel=${config.papel}&reimpressao=${reimpressao?'1':'0'}`,'_blank')
    if(w){w.opener=null;setMensagem('Prévia USB aberta. Selecione a impressora na janela de impressão e confira o papel.')}else setMensagem('Permita abrir a prévia de impressão no navegador.')
  }
  async function imprimir() {
    if (enviando.current) return
    if (reimpressao && !window.confirm('Confira se a cozinha já recebeu este pedido. Deseja enviar outra via?')) return
    enviando.current = true
    setOcupado(true)
    setMensagem('')
    chave.current ||= crypto.randomUUID()
    try {
      const response = await fetch('/api/bar/imprimir', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:chave.current, pedido_id:pedidoId, reimpressao }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha no envio')
      setMensagem(data.mensagem)
      if (reimpressao) chave.current = undefined
    } catch (e: any) { setMensagem(e.message || 'Falha de conexão. Confira a cozinha antes de tentar outra via.') }
    finally { enviando.current = false; setOcupado(false) }
  }
  return <div className="space-y-2">
    <BotaoUSBLocal pedidoId={pedidoId} destino="cozinha" reimpressao={reimpressao}/>
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={ocupado} onClick={imprimirUSB} className="gap-2"><Printer size={16}/>{reimpressao?'Reimprimir pelo navegador':'Imprimir pelo navegador'}</Button>
    <Button variant="outline" disabled={ocupado} onClick={imprimir} className="gap-2"><Printer size={16}/>{ocupado ? 'Enviando...' : reimpressao ? 'Reimprimir pela rede' : 'Enviar pela rede'}</Button></div>
    <p role="status" className="text-sm text-gray-600">{mensagem}</p>
    <p className="text-xs text-gray-500">Use uma das opções e confira o papel antes de emitir outra via.</p>
  </div>
}
