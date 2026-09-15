'use client'
import {useEffect,useRef,useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card'
const nomes:Record<string,string>={clube_entrada:'Entrada no clube',exame:'Exame médico',piscina_entrada:'Entrada na piscina',piscina_saida:'Saída da piscina'}
export async function atenderConvite(qr:string,acao:string,extra:Record<string,string>={}){
 const r=await fetch('/api/convites/atendimento',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qr,acao,...extra})})
 const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível atender o convite.');return d
}
export default function AtendimentoConvidado({qr,modo}:{qr:string;modo:'exame'|'piscina'}){
 const [dados,setDados]=useState<any>(null),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false),[mensagem,setMensagem]=useState('')
 const [resultado,setResultado]=useState(''),[medico,setMedico]=useState(''),[crm,setCrm]=useState('')
 const trava=useRef(false),pendente=useRef<{chave:string;id:string}|null>(null)
 useEffect(()=>{let ativo=true;setDados(null);setErro('');setMensagem('');setResultado('');pendente.current=null
 atenderConvite(qr,'consultar').then(d=>{if(ativo)setDados(d)}).catch(e=>{if(ativo)setErro(e.message)})
 return()=>{ativo=false}
 },[qr])
 async function executar(acao:string){
  if(trava.current)return;trava.current=true;setOcupado(true);setErro('');setMensagem('')
  const chave=JSON.stringify([qr,acao,resultado,medico,crm])
  if(pendente.current?.chave!==chave)pendente.current={chave,id:crypto.randomUUID()}
  try{setDados(await atenderConvite(qr,acao,{requisicao:pendente.current.id,resultado,medico,crm}));pendente.current=null;setMensagem(nomes[acao]+' registrado(a).')}
  catch(e:any){setErro(e.message)}finally{trava.current=false;setOcupado(false)}
 }
 return <Card><CardHeader><CardTitle>Convidado — {modo==='exame'?'exame médico':'piscina'}</CardTitle></CardHeader><CardContent className="space-y-4">
 {erro&&<p role="alert" className="text-red-700">{erro}</p>}{mensagem&&<p role="status" className="text-green-700">{mensagem}</p>}
 <Button type="button" variant="outline" disabled={ocupado} onClick={()=>{setErro('');atenderConvite(qr,'consultar').then(setDados).catch(e=>setErro(e.message))}}>Atualizar situação</Button>
 {!dados&&!erro&&<p>Consultando convite...</p>}
 {dados&&<><p className="font-bold text-xl">{dados.nome}</p><p>Visita: {new Date(dados.data_visita+'T12:00:00').toLocaleDateString('pt-BR')} • Convite {dados.status}</p>
 <p>Clube: {dados.entrada_clube?'entrada registrada':'aguardando entrada'} • Exame: {dados.exame?.resultado||'não realizado'} • Piscina: {dados.na_piscina?'dentro':dados.piscina_liberada?'liberada':'bloqueada'}</p>
 {modo==='exame'?<div className="space-y-3"><p>Exame do convidado válido somente no dia da visita. O último resultado define a liberação da piscina.</p>
 <label className="block">Resultado<select className="block border rounded p-2" value={resultado} onChange={e=>setResultado(e.target.value)} disabled={ocupado}><option value="">Selecione</option><option value="apto">Apto</option><option value="inapto">Inapto</option></select></label>
 <label className="block">Médico responsável<Input value={medico} maxLength={120} onChange={e=>setMedico(e.target.value)} disabled={ocupado}/></label>
 <label className="block">CRM / UF<Input value={crm} maxLength={30} onChange={e=>setCrm(e.target.value)} disabled={ocupado}/></label>
 <Button type="button" disabled={ocupado||!dados.entrada_clube||!resultado||medico.trim().length<2||crm.trim().length<2} onClick={()=>executar('exame')}>Registrar exame do convidado</Button></div>:
 <div className="flex gap-3"><Button type="button" disabled={ocupado||!dados.piscina_liberada||dados.na_piscina} onClick={()=>executar('piscina_entrada')}>Registrar entrada na piscina</Button><Button type="button" variant="outline" disabled={ocupado||!dados.na_piscina} onClick={()=>executar('piscina_saida')}>Registrar saída da piscina</Button></div>}
 <details><summary>Histórico deste convite</summary><ul className="space-y-2 mt-2">{dados.historico.map((h:any)=><li key={h.id}>{new Date(h.data).toLocaleString('pt-BR')} — {nomes[h.acao]}{h.resultado?': '+h.resultado:''}{h.medico?' — '+h.medico+' / '+h.crm:''}</li>)}</ul></details></>}
 </CardContent></Card>
}
