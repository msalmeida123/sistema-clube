'use client'
import {useEffect,useState,useRef} from 'react'
import {lerRespostaCnpj} from '@/lib/resposta-cnpj'
import {InputAssociado} from './InputAssociado'
import {cnpjValido,formatarCnpj,normalizarCnpj} from '@/lib/cnpj'
export function CnpjAssociado({value,onChange,onEmpresa,erro}:{value:string;onChange:(v:string)=>void;onEmpresa:(d:any)=>void;erro?:string}){
 const inicial=useRef(true)
 const [mensagem,setMensagem]=useState(''),[falha,setFalha]=useState(false),[tentativa,setTentativa]=useState(0)
 useEffect(()=>{
  if(inicial.current){inicial.current=false;return}
  const controller=new AbortController();let ativo=true
  setMensagem('');setFalha(false)
  if(!cnpjValido(value))return
  const timer=setTimeout(async()=>{setMensagem('Consultando empresa...');try{
   const r=await fetch('/api/cnpj/'+normalizarCnpj(value),{signal:controller.signal,cache:'no-store'});const d=await lerRespostaCnpj(r);if(!ativo)return
   onEmpresa(d);setMensagem(`Empresa encontrada${d.situacao?': '+d.situacao:''}. Confira os dados antes de salvar.`)
  }catch(e:any){if(ativo){setMensagem(e.message||'Consulta indisponível.');setFalha(true)}}},500)
  return()=>{ativo=false;clearTimeout(timer);controller.abort()}
 // onEmpresa atualiza o formulário; a consulta depende somente do documento.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[value,tentativa])
 return <div><label htmlFor="associado-cnpj">CNPJ *</label><InputAssociado name="cnpj" value={formatarCnpj(value)} onChange={e=>onChange(formatarCnpj(e.target.value))} erro={erro} required maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00"/><p role="status" className={falha?'text-sm text-red-700':'text-sm text-muted-foreground'}>{mensagem}</p>{falha&&<button type="button" className="underline" onClick={()=>setTentativa(n=>n+1)}>Consultar novamente</button>}</div>
}
