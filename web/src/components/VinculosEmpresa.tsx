'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {createClientComponentClient} from '@/lib/supabase/client'
export function VinculosEmpresa({id,empresaId,pj}:{id:string;empresaId?:string|null;pj:boolean}){
 const [lista,setLista]=useState<any[]>([]),[pagina,setPagina]=useState(1),[mais,setMais]=useState(false),[erro,setErro]=useState('')
 useEffect(()=>{let ativo=true;async function carregar(){if(!pj&&!empresaId)return;const db=createClientComponentClient();let q=db.from('associados').select('id,nome,status');q=pj?q.eq('empresa_associada_id',id).order('nome').order('id').range((pagina-1)*20,pagina*20):q.eq('id',empresaId!);const {data,error}=await q;if(ativo){setErro(error?'Não foi possível carregar os vínculos.':'');setLista((data||[]).slice(0,20));setMais((data||[]).length>20)}}void carregar();return()=>{ativo=false}},[id,empresaId,pj,pagina])
 if(!pj&&!empresaId)return null
 return <section className="rounded-lg border bg-white p-6 space-y-3"><h3 className="text-lg font-semibold">{pj?'Funcionários associados vinculados':'Empresa vinculada'}</h3>{erro?<p role="alert">{erro}</p>:lista.length?lista.map(c=><p key={c.id}><Link className="underline" href={'/dashboard/associados/'+c.id}>{c.nome}</Link> — {c.status}</p>):<p>Nenhum vínculo encontrado.</p>}{pj&&<div className="flex gap-3"><button disabled={pagina===1} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina}</span><button disabled={!mais} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div>}</section>
}
