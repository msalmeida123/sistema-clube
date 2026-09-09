'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function ImprimirCozinha({ pedidoId, reimpressao = false }: { pedidoId: string; reimpressao?: boolean }) {
  const [ocupado, setOcupado] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const chave = useRef<string>()
  const enviando = useRef(false)
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
    <Button variant="outline" disabled={ocupado} onClick={imprimir} className="gap-2"><Printer size={16}/>{ocupado ? 'Enviando...' : reimpressao ? 'Reimprimir na cozinha' : 'Enviar à cozinha'}</Button>
    <p role="status" className="text-sm text-gray-600">{mensagem}</p>
    <a className="text-xs text-blue-600 underline" href={`/api/bar/comprovante?pedido_id=${pedidoId}&via=cozinha`} target="_blank" rel="noopener noreferrer">Visualizar / imprimir pelo navegador</a>
  </div>
}
