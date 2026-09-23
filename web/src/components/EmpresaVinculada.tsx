'use client'
import {useEffect,useState} from 'react'
import {createClientComponentClient} from '@/lib/supabase/client'
export function EmpresaVinculada({value,onChange,erro:erroCampo}:{value:string;onChange:(id:string)=>void;erro?:string}){
 const [busca,setBusca]=useState(''),[opcoes,setOpcoes]=useState<any[]>([]),[erro,setErro]=useState('')
 useEffect(()=>{let ativo=true;const timer=setTimeout(async()=>{
  const db=createClientComponentClient();let q=db.from('associados').select('id,nome,cnpj').eq('tipo_cadastro','pj').order('nome').limit(20)
  const termo=busca.replace(/[^A-Za-zÀ-ÿ0-9 .\/-]/g,'').slice(0,100)
  if(termo)q=q.ilike('nome',`%${termo}%`)
  const {data,error}=await q
  let todas=data||[]
  if(value&&!todas.some(c=>c.id===value)){const r=await db.from('associados').select('id,nome,cnpj').eq('id',value).eq('tipo_cadastro','pj').maybeSingle();if(r.data)todas=[r.data,...todas]}
  if(ativo){setOpcoes(todas);setErro(error?'Não foi possível consultar empresas.':'')}
 },300);return()=>{ativo=false;clearTimeout(timer)}},[busca,value])
 return <div className="min-w-0 space-y-2"><label htmlFor="empresa-vinculada">Empresa vinculada (opcional)</label><input aria-label="Buscar empresa cadastrada por nome" className="w-full min-w-0 max-w-full h-10 border rounded-md px-3" placeholder="Buscar empresa cadastrada por nome" value={busca} onChange={e=>setBusca(e.target.value)}/><select name="empresa_associada_id" id="empresa-vinculada" aria-invalid={!!erroCampo} aria-describedby={erroCampo?"empresa-vinculada-erro":undefined} className={`w-full min-w-0 max-w-full h-10 border rounded-md px-3 ${erroCampo?"border-red-600 bg-red-50":""}`} value={value} onChange={e=>onChange(e.target.value)}><option value="">Nenhuma empresa</option>{opcoes.map(c=><option key={c.id} value={c.id}>{c.nome} — {c.cnpj}</option>)}</select>{erroCampo&&<p id="empresa-vinculada-erro" role="alert" className="text-red-700">{erroCampo}</p>}<p className="text-sm text-muted-foreground">Você pode vincular uma empresa depois, se necessário.</p>{erro&&<p role="alert" className="text-red-700">{erro}</p>}</div>
}
