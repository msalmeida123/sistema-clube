'use client'
import {createContext,useContext,useEffect,useState} from 'react'
import type {CSSProperties,ReactNode} from 'react'
import {StatusServico} from '@/lib/servicos'
import {createClient} from '@/lib/supabase/client'
import {Button} from '@/components/ui/button'
import {toast} from 'sonner'

const padrao={a_fazer:'#64748b',em_andamento:'#2563eb',concluido:'#059669',urgente:'#dc2626'}
type Cores=typeof padrao
type Chave=keyof Cores
const nomes:Record<Chave,string>={a_fazer:'A fazer',em_andamento:'Iniciado',concluido:'Finalizado',urgente:'Urgente'}
const chaves=Object.keys(padrao) as Chave[]
const Contexto=createContext<Cores>(padrao)
export function useCoresServicos(){return useContext(Contexto)}
export function estiloServico(cores:Cores,status:StatusServico,prioridade:string):CSSProperties{
 const cor=cores[status==='concluido'?'concluido':prioridade==='alta'?'urgente':status]
 return {borderColor:cor,backgroundColor:cor+'14',color:'#0f172a'}
}
export function SelosServico({status,prioridade}:{status:StatusServico;prioridade:string}){
 const cores=useCoresServicos()
 return <div className="flex flex-wrap gap-1 text-xs font-semibold">
  {[status,...(prioridade==='alta'?['urgente' as const]:[])].map(chave=><span key={chave} className="rounded-full border px-2 py-1" style={{borderColor:cores[chave],backgroundColor:cores[chave]+'20',color:'#0f172a'}}>{nomes[chave]}</span>)}
 </div>
}
export function CoresServicosProvider({children}:{children:ReactNode}){
 const [cores,setCores]=useState<Cores>(padrao)
 const db=createClient()
 useEffect(()=>{let ativo=true;async function carregar(){const {data,error}=await db.from('servicos_cores').select('a_fazer,em_andamento,concluido,urgente').eq('id',true).single();if(ativo&&!error&&data)setCores(data as Cores)}void carregar();const timer=setInterval(()=>void carregar(),30000);return()=>{ativo=false;clearInterval(timer)}},[db])
 return <Contexto.Provider value={cores}>{children}<ConfiguracaoCores onSave={setCores}/></Contexto.Provider>
}
// The editor is opened by a local event so the legend can remain above the board.
export function PaletaServicos({admin}:{admin:boolean}){
 const cores=useCoresServicos()
 return <div className="rounded-lg border bg-white p-3 space-y-2" aria-label="Paleta de cores dos serviços">
  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">Cores dos serviços</p>{admin&&<Button variant="outline" onClick={()=>window.dispatchEvent(new Event('servicos-configurar-cores'))}>Configurar cores</Button>}</div>
  <div className="flex flex-wrap gap-2">{chaves.map(chave=><span key={chave} className="rounded-lg border border-l-4 px-3 py-2 text-sm font-medium" style={{borderColor:cores[chave],backgroundColor:cores[chave]+'14',color:'#0f172a'}}>{nomes[chave]}</span>)}</div>
  <p className="text-xs text-slate-600">Urgente destaca o cartão até sua finalização. As cores escolhidas valem para toda a equipe.</p>
 </div>
}
function ConfiguracaoCores({onSave}:{onSave:(c:Cores)=>void}){
 const db=createClient()
 const [rascunho,setRascunho]=useState<Cores|null>(null)
 const [original,setOriginal]=useState<Cores|null>(null)
 const [salvando,setSalvando]=useState(false)
 useEffect(()=>{async function abrir(){const {data,error}=await db.from('servicos_cores').select('a_fazer,em_andamento,concluido,urgente').eq('id',true).single();if(error||!data){toast.error('Não foi possível carregar as cores. Verifique a configuração do banco.');return}setOriginal(data as Cores);setRascunho(data as Cores)}window.addEventListener('servicos-configurar-cores',abrir);return()=>window.removeEventListener('servicos-configurar-cores',abrir)},[db])
 async function salvar(){if(!rascunho||!original)return;setSalvando(true);try{let q=db.from('servicos_cores').update(rascunho).eq('id',true);for(const chave of chaves)q=q.eq(chave,original[chave]);const {error}=await q.select('id').single();if(error)throw error;onSave(rascunho);setRascunho(null);toast.success('Cores salvas para toda a equipe')}catch{toast.error('Não foi possível salvar. Confira sua permissão de administrador e reabra a configuração.')}finally{setSalvando(false)}}
 if(!rascunho)return null
 return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label="Configurar cores dos serviços" className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-auto">
  <h2 className="text-xl font-bold">Configurar cores</h2><p className="text-sm text-slate-600">Escolha uma cor para cada situação. A prévia muda enquanto você escolhe.</p>
  {chaves.map(chave=><div key={chave} className="flex items-center gap-3"><label className="flex items-center gap-2 min-w-36"><input type="color" aria-label={'Cor de '+nomes[chave]} value={rascunho[chave]} disabled={salvando} onChange={e=>setRascunho({...rascunho,[chave]:e.target.value})} className="h-10 w-12 cursor-pointer"/>{nomes[chave]}</label><div className="flex-1 rounded-lg border border-l-4 p-3 text-sm" style={{borderColor:rascunho[chave],backgroundColor:rascunho[chave]+'14',color:'#0f172a'}}>{nomes[chave]}<span className="block text-xs">{rascunho[chave].toUpperCase()}</span></div></div>)}
  <div className="flex gap-2 flex-wrap"><Button disabled={salvando} onClick={()=>void salvar()}>{salvando?'Salvando...':'Salvar cores'}</Button><Button variant="outline" disabled={salvando} onClick={()=>setRascunho(padrao)}>Restaurar padrão</Button><Button variant="outline" disabled={salvando} onClick={()=>setRascunho(null)}>Cancelar</Button></div>
 </div></div>
}
