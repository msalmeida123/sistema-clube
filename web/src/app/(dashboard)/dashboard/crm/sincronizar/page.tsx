'use client'
import {useEffect,useState} from 'react'
export default function SincronizarContatos(){
 const [id,setId]=useState(''),[mensagem,setMensagem]=useState(''),[ocupado,setOcupado]=useState(false)
 useEffect(()=>{let ativo=true;let timer:ReturnType<typeof setTimeout>;if(!id)return
  const consultar=async()=>{try{
   const r=await fetch('/api/wasender/sync-contacts?jobId='+encodeURIComponent(id),{cache:'no-store'});const d=await r.json();if(!ativo)return
   if(!r.ok)throw Error(d.error)
   if(d.status==='completed'||d.status==='failed'){setMensagem(d.status==='completed'?'Sincronização concluída.':d.error);setId('');setOcupado(false);return}
   setMensagem(`Sincronizando: ${d.progresso?.processados||0} de ${d.progresso?.total||100} contatos.`)
   timer=setTimeout(consultar,3000)
  }catch(e:any){if(ativo){setMensagem(e.message||'Falha ao consultar tarefa.');setOcupado(false)}}}
  void consultar();return()=>{ativo=false;clearTimeout(timer)}
 },[id])
 async function iniciar(){setOcupado(true);try{const r=await fetch('/api/wasender/sync-contacts',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error);setMensagem(d.message);if(d.jobId)setId(d.jobId);else setOcupado(false)}catch(e:any){setMensagem(e.message);setOcupado(false)}}
 return <div className="space-y-4"><h1 className="text-2xl font-bold">Sincronizar contatos</h1><p>Atualiza nomes e fotos ausentes em lotes de até 100 contatos. Operação disponível para administradores.</p><button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={ocupado} onClick={iniciar}>Sincronizar contatos pendentes</button><p role="status">{mensagem}</p><a className="underline" href="/dashboard/crm">Voltar ao CRM</a></div>
}
