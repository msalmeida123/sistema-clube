'use client'
import {useState} from 'react'
import {createClientComponentClient} from '@/lib/supabase/client'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner'
export default function PagamentoMensalidade({mensalidade,onPago}:{mensalidade:any;onPago:()=>void}) {
 const [aberto,setAberto]=useState(false),[ocupado,setOcupado]=useState(false)
 const [forma,setForma]=useState('debito'),[nsu,setNsu]=useState(''),[operadora,setOperadora]=useState(''),[confirmado,setConfirmado]=useState(false)
 const [requisicao,setRequisicao]=useState('')
 const total=Number(mensalidade.valor)+Number(mensalidade.multa||0)+Number(mensalidade.juros||0)-Number(mensalidade.desconto||0)
 async function salvar(e:React.FormEvent){e.preventDefault();setOcupado(true)
  try{const {error}=await createClientComponentClient().rpc('confirmar_cartao_mensalidade',{mensalidade:mensalidade.id,forma,nsu:nsu.trim(),operadora:operadora.trim(),requisicao,valor:Math.round(total*100)/100});if(error)throw error
   toast.success('Pagamento registrado com log. Os requisitos de acesso serão consultados novamente.');setAberto(false);onPago()
  }catch(e:any){toast.error(e.message||'Não foi possível confirmar. Confira antes de tentar novamente.')}finally{setOcupado(false)}}
 return <div><Button size="sm" variant="outline" onClick={()=>{setRequisicao(crypto.randomUUID());setConfirmado(false);setAberto(true)}}>Receber na maquininha</Button>
 {aberto&&<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 clube-modal-overlay"><form data-pagamento-modal role="dialog" aria-modal="true" aria-label="Confirmar pagamento na maquininha" onSubmit={salvar} className="bg-white rounded-xl p-6 space-y-4 max-w-lg w-full text-left text-gray-900">
 <h2 className="font-bold text-xl">Confirmar pagamento na maquininha</h2>
 <p>{mensalidade.tipo==='academia'?'Academia':'Clube'} · {mensalidade.referencia||mensalidade.mes_referencia} · <strong>{total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></p>
 <label className="block">Forma<select className="border p-2 w-full rounded" value={forma} onChange={e=>setForma(e.target.value)} disabled={ocupado}><option value="debito">Débito</option><option value="credito">Crédito</option></select></label>
 <label className="block">Operadora da maquininha<Input required maxLength={80} value={operadora} onChange={e=>setOperadora(e.target.value)} disabled={ocupado}/></label>
 <label className="block">NSU / número da transação<Input required maxLength={80} value={nsu} onChange={e=>setNsu(e.target.value)} disabled={ocupado}/></label>
 <label className="flex gap-2"><input type="checkbox" required checked={confirmado} onChange={e=>setConfirmado(e.target.checked)} disabled={ocupado}/>Conferi que esta transação foi aprovada na maquininha para esta mensalidade.</label>
 <p className="text-sm">Seu usuário, data, valor e dados da transação serão registrados. É necessária permissão financeira de edição.</p>
 <div className="flex gap-2"><Button disabled={ocupado||!confirmado} type="submit">{ocupado?'Registrando…':'Confirmar recebimento'}</Button><Button type="button" variant="outline" disabled={ocupado} onClick={()=>setAberto(false)}>Cancelar</Button></div>
 </form></div>}</div>
}
