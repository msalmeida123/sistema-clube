'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const inicial = { nome:'Cozinha', ip:'', porta:9100, colunas:48, protocolo:'texto', cortar:false, ativo:false }
export default function ImpressoraPage() {
  const [form, setForm] = useState(inicial)
  const [carregando, setCarregando] = useState(true)
  const [carregado, setCarregado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [mensagem, setMensagem] = useState('')
  useEffect(() => {
    fetch('/api/bar/impressora').then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setForm(d); setCarregado(true) }).catch(e => setMensagem(e.message)).finally(() => setCarregando(false))
  }, [])
  function alterar(patch: Partial<typeof inicial>) { setForm(f => ({...f,...patch})); setAlterado(true); setMensagem('') }
  async function executar(teste = false) {
    setOcupado(true); setMensagem('')
    try {
      const r = await fetch(teste ? '/api/bar/imprimir' : '/api/bar/impressora', { method:teste ? 'POST':'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(teste ? {teste:true}:form) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      if (!teste) setAlterado(false)
      setMensagem(teste ? d.mensagem : 'Configuração salva neste sistema local.')
    } catch(e: any) { setMensagem(e.message || 'Não foi possível concluir') } finally { setOcupado(false) }
  }
  return <div className="p-6 max-w-2xl space-y-6">
    <h1 className="text-2xl font-bold">Impressora da Cozinha</h1>
    <p className="text-gray-600">Configure uma impressora térmica de rede com impressão RAW TCP. Use o endereço IP exibido na configuração da impressora.</p>
    {carregando ? <p>Carregando...</p> : <fieldset disabled={ocupado || !carregado} className="bg-white border rounded-xl p-6 space-y-4 disabled:opacity-60">
      <label className="block">Nome / modelo<Input value={form.nome} maxLength={60} onChange={e=>alterar({nome:e.target.value})}/></label>
      <div className="grid grid-cols-2 gap-4">
        <label>Endereço IP<Input placeholder="192.168.1.150" value={form.ip} onChange={e=>alterar({ip:e.target.value})}/></label>
        <label>Porta TCP<Input type="number" min={9100} max={9109} value={form.porta} onChange={e=>alterar({porta:Number(e.target.value)})}/></label>
      </div>
      <p className="text-xs text-gray-500">A porta usual é 9100. O computador com Docker precisa alcançar a impressora na rede local.</p>
      <label className="block">Papel<select className="block border rounded p-2 w-full" value={form.colunas} onChange={e=>alterar({colunas:Number(e.target.value)})}><option value={48}>80 mm (48 colunas)</option><option value={32}>58 mm (32 colunas)</option></select></label>
      <label className="block">Modo de impressão<select className="block border rounded p-2 w-full" value={form.protocolo} onChange={e=>alterar({protocolo:e.target.value})}><option value="texto">Texto simples</option><option value="escpos">ESC/POS (impressora compatível)</option></select></label>
      <p className="text-xs text-gray-500">O texto é enviado sem acentos para evitar caracteres incorretos. Confirme o modo compatível no manual do modelo.</p>
      <label className="flex gap-2"><input type="checkbox" checked={form.cortar} disabled={form.protocolo !== 'escpos'} onChange={e=>alterar({cortar:e.target.checked})}/>Cortar papel ao terminar (ESC/POS)</label>
      <label className="flex gap-2"><input type="checkbox" checked={form.ativo} onChange={e=>alterar({ativo:e.target.checked})}/>Ativar impressão de rede</label>
      <div className="flex flex-wrap gap-3"><Button onClick={()=>executar()} disabled={ocupado}>Salvar configuração</Button><Button variant="outline" disabled={ocupado || alterado || !form.ativo} onClick={()=>executar(true)}>Imprimir teste</Button></div>
      {alterado && <p className="text-sm">Salve as alterações antes de testar.</p>}
    </fieldset>}
    <p role="status" className="text-sm">{mensagem}</p>
    <p className="text-sm text-gray-500">O teste imprime uma mensagem curta. O sistema confirma o envio dos dados; confira o papel para confirmar a impressão. Para os pedidos, use “Enviar à cozinha” após finalizar a venda.</p>
  </div>
}
