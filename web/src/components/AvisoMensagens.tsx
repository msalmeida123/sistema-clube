'use client'
import {useEffect,useState} from 'react'
import {Bell} from 'lucide-react'
import Link from 'next/link'
import {portalApi} from '@/lib/portal-api'
import {EVENTO_LEITURA,TipoLeitor} from '@/lib/mensagens-eventos'
import './mensagens-clube.css'
export function AvisoMensagens({tipo,onClick}:{tipo:TipoLeitor;onClick?:()=>void}){
 const [count,setCount]=useState(0)
 useEffect(()=>{
  let ativo=true,versao=0
  const controller=new AbortController()
  const atualizar=async()=>{if(document.hidden)return;const v=++versao;try{
   const j=await portalApi<{nao_lidas:number}>((tipo==='associado'?'/api/associado-app':'/api/associados')+'/mensagens?resumo=1',{signal:controller.signal})
   if(ativo&&v===versao&&Number.isSafeInteger(j.nao_lidas)&&j.nao_lidas>=0)setCount(j.nao_lidas)
  }catch{}}
  const lida=(e:Event)=>{const d=(e as CustomEvent).detail;if(d?.tipo!==tipo)return;++versao;setCount(d.total);void atualizar()}
  const canal=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(EVENTO_LEITURA):null
  if(canal)canal.onmessage=()=>void atualizar()
  void atualizar();const t=setInterval(atualizar,30000)
  window.addEventListener('focus',atualizar);document.addEventListener('visibilitychange',atualizar);window.addEventListener(EVENTO_LEITURA,lida)
  return()=>{ativo=false;++versao;controller.abort();clearInterval(t);canal?.close();window.removeEventListener('focus',atualizar);document.removeEventListener('visibilitychange',atualizar);window.removeEventListener(EVENTO_LEITURA,lida)}
 },[tipo])
 const label=`Mensagens: ${count} ${count===1?'não lida':'não lidas'}`
 const content=<><Bell size={20} aria-hidden="true"/>{count>0&&<span className="clube-msg-contador" aria-hidden="true">{count>99?'99+':count}</span>}</>
 return onClick?<button className="clube-mensagens-atalho" aria-label={label} onClick={onClick}>{content}</button>:<Link className="clube-mensagens-atalho" aria-label={label} href="/dashboard/associados/mensagens">{content}</Link>
}
