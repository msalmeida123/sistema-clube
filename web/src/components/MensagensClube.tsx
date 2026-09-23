'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {NotificacoesClube} from './NotificacoesClube'
import {ErroPortal,erroCancelado,mensagemPortal,portalApi} from '@/lib/portal-api'
import {avisarLeitura,EVENTO_LEITURA,EVENTO_SESSAO,TipoLeitor} from '@/lib/mensagens-eventos'
import './mensagens-clube.css'
type Mensagem={id:string;texto:string;remetente_tipo:string;criado_em:string;lida:boolean}
export function MensagensClube({tipo,associadoId}:{tipo:TipoLeitor;associadoId?:string}){
 const [mensagens,setMensagens]=useState<Mensagem[]>([]),[nome,setNome]=useState(''),[pagina,setPagina]=useState(0),[mais,setMais]=useState(false),[texto,setTexto]=useState(''),[erro,setErro]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0)
 const idEnvio=useRef<string|null>(null),trava=useRef(false),versao=useRef(0),lidas=useRef(new Set<string>()),montado=useRef(true)
 const base=(tipo==='associado'?'/api/associado-app':'/api/associados')+'/mensagens'
 const tratarErro=useCallback((e:unknown)=>{if(erroCancelado(e))return;setErro(mensagemPortal(e));if(tipo==='associado'&&e instanceof ErroPortal&&e.status===401)window.dispatchEvent(new Event(EVENTO_SESSAO))},[tipo])
 useEffect(()=>{montado.current=true;return()=>{montado.current=false}},[])
 useEffect(()=>{setPagina(0);setMensagens([]);setTexto('');idEnvio.current=null;lidas.current.clear();++versao.current},[associadoId,tipo])
 useEffect(()=>{
  let ativo=true,carregando=false;const c=new AbortController()
  async function atualizar(){
   if(document.hidden||carregando||trava.current)return
   carregando=true;const v=++versao.current
   try{
    const j=await portalApi(base+'?pagina='+pagina+(associadoId?'&associado_id='+encodeURIComponent(associadoId):''),{signal:c.signal})
    if(!Array.isArray(j.mensagens)||!j.associado)throw new ErroPortal('Não foi possível carregar as informações. Tente novamente.')
    if(ativo&&v===versao.current){setMensagens(j.mensagens.map((m:Mensagem)=>({...m,lida:m.lida||lidas.current.has(m.id)})));setNome(j.associado.nome);setMais(j.mais);setErro('')}
   }catch(e){if(ativo&&v===versao.current)tratarErro(e)}finally{carregando=false}
  }
  const canal=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(EVENTO_LEITURA):null
  if(canal)canal.onmessage=()=>void atualizar()
  void atualizar();const t=setInterval(atualizar,15000);window.addEventListener('focus',atualizar);document.addEventListener('visibilitychange',atualizar)
  return()=>{ativo=false;c.abort();canal?.close();clearInterval(t);window.removeEventListener('focus',atualizar);document.removeEventListener('visibilitychange',atualizar)}
 },[base,associadoId,pagina,refresh,tratarErro])
 async function post(method:string,body:unknown){return portalApi(base,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...body as object,...(associadoId?{associado_id:associadoId}:{})})})}
 async function marcar(ids:string[]){
  const unicos=Array.from(new Set(ids)).filter(id=>!lidas.current.has(id))
  if(trava.current||!unicos.length)return
  trava.current=true;++versao.current;setBusy(true);setErro('')
  try{
   const j=await post('PATCH',{ids:unicos})
   if(!Array.isArray(j.ids)||!Number.isSafeInteger(j.nao_lidas)||j.nao_lidas<0)throw new ErroPortal('Não foi possível confirmar a leitura. Tente novamente.')
   if(!montado.current)return
   const confirmados=new Set<string>(j.ids)
   j.ids.forEach((id:string)=>lidas.current.add(id))
   setMensagens(ms=>ms.map(m=>confirmados.has(m.id)?{...m,lida:true}:m))
   avisarLeitura(tipo,j.nao_lidas)
  }catch(e){if(montado.current)tratarErro(e)}finally{trava.current=false;if(montado.current)setBusy(false)}
 }
 const naoLidas=mensagens.filter(m=>m.remetente_tipo!==tipo&&!m.lida)
 return <section className="clube-mensagens"><h2>{tipo==='associado'?'Mensagens com o clube':nome||'Conversa com associado'}</h2><NotificacoesClube tipo={tipo}/>{erro&&<p role="alert" className="clube-msg-erro">{erro}</p>}
 <div className="clube-msg-actions"><button disabled={!mais||busy} onClick={()=>setPagina(p=>p+1)}>Mais antigas</button><span>Página {pagina+1}</span><button disabled={pagina===0||busy} onClick={()=>setPagina(p=>p-1)}>Mais recentes</button>{naoLidas.length>0&&<button disabled={busy} onClick={()=>void marcar(naoLidas.map(m=>m.id))}>Marcar estas mensagens como lidas ({naoLidas.length})</button>}</div>
 <div className="clube-msg-historico" aria-label="Histórico de mensagens">{!mensagens.length&&<p>Nenhuma mensagem nesta conversa.</p>}{mensagens.map(m=>{
 const pendente=m.remetente_tipo!==tipo&&!m.lida
 return <article key={m.id} className={'clube-msg-balao '+(m.remetente_tipo===tipo?'minha':'')} role={pendente?'button':undefined} tabIndex={pendente?0:undefined} aria-disabled={pendente?busy:undefined} aria-describedby={pendente?'mensagem-'+m.id:undefined} aria-label={pendente?'Mensagem não lida. Abrir e marcar como lida.':undefined} onClick={()=>{if(pendente)void marcar([m.id])}} onKeyDown={e=>{if(pendente&&(e.key==='Enter'||e.key===' ')){e.preventDefault();void marcar([m.id])}}}><strong>{m.remetente_tipo==='associado'?'Associado':'Equipe do clube'}</strong><p id={'mensagem-'+m.id}>{m.texto}</p><small>{new Date(m.criado_em).toLocaleString('pt-BR')}{m.remetente_tipo!==tipo?(m.lida?' · Lida':' · Não lida'):''}</small></article>
 })}</div>
 <form onSubmit={async e=>{e.preventDefault();if(!texto.trim()||trava.current)return;trava.current=true;setBusy(true);setErro('');try{idEnvio.current??=crypto.randomUUID();await post('POST',{id:idEnvio.current,texto});idEnvio.current=null;setTexto('');setPagina(0);setRefresh(p=>p+1)}catch(e){tratarErro(e)}finally{trava.current=false;setBusy(false)}}}><label>Mensagem<textarea required rows={3} maxLength={3000} value={texto} onChange={e=>{setTexto(e.target.value);idEnvio.current=null}} disabled={busy}/></label><button className="clube-msg-enviar" disabled={busy||!texto.trim()}>{busy?'Aguarde…':'Enviar mensagem'}</button></form></section>
}
