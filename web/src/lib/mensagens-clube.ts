import {falhaPortal} from './portal-servidor'
import {NextRequest,NextResponse} from 'next/server'
import {z} from 'zod'
import {appDb,limite,sessaoAssociado} from './associado-app'
import {acessoRota} from './supabase/acesso-rota'
export const mensagemSchema=z.object({id:z.string().uuid(),associado_id:z.string().uuid().optional(),texto:z.string().trim().min(1).max(3000)}).strict()
export const leituraSchema=z.object({ids:z.array(z.string().uuid()).min(1).max(30),associado_id:z.string().uuid().optional()}).strict()
export function origemMensagem(req:NextRequest){
 const origin=req.headers.get('origin')
 if(origin===req.nextUrl.origin)return true
 // O proxy preserva Host; o servidor Next pode usar seu endereço interno na URL.
 return ['https://app.intellia.ia.br','https://sistema.intellia.ia.br'].includes(origin||'')&&req.headers.get('host')===new URL(origin!).host
}
export async function atorMensagem(req:NextRequest,tipo:'associado'|'equipe',escrever=false){
 if(tipo==='associado'){const s=await sessaoAssociado(req);return s?{tipo,id:s.associado.id,db:s.db,session:s.tokenHash}:null}
 const a=await acessoRota('associados',escrever?'editar':'visualizar');return a?{tipo,id:a.user.id,db:appDb(),session:null}:null
}
export async function endpointMensagens(req:NextRequest,tipo:'associado'|'equipe'){
 if(req.method!=='GET'&&!origemMensagem(req))return NextResponse.json({error:'Origem não permitida.'},{status:403})
 try{
 const ator=await atorMensagem(req,tipo,req.method==='POST');if(!ator)return NextResponse.json({error:'Entre novamente ou confira sua permissão.'},{status:tipo==='associado'?401:403})
 const db=ator.db
 if(req.method==='GET'){
  if(req.nextUrl.searchParams.get('resumo')==='1'){
   const {data,error}=await db.rpc('clube_mensagens_nao_lidas',{p_tipo:tipo,p_id:ator.id});if(error)throw error
   return NextResponse.json({nao_lidas:Number(data||0)},{headers:{'Cache-Control':'no-store'}})
  }
  const pagina=z.coerce.number().int().min(0).max(10000).parse(req.nextUrl.searchParams.get('pagina')||0)
  if(tipo==='equipe'&&req.nextUrl.searchParams.get('caixa')==='1'){
   const {data,error}=await db.rpc('clube_caixa_mensagens',{p_usuario:ator.id,p_pagina:pagina});if(error)throw error
   return NextResponse.json({conversas:(data||[]).slice(0,30),mais:(data||[]).length>30},{headers:{'Cache-Control':'no-store'}})
  }
  const aid=tipo==='associado'?ator.id:z.string().uuid().parse(req.nextUrl.searchParams.get('associado_id'))
  const {data:a,error:ae}=await db.from('associados').select('id,nome').eq('id',aid).maybeSingle();if(ae||!a)return NextResponse.json({error:'Associado não encontrado.'},{status:404})
  const {data,error}=await db.from('clube_mensagens').select('id,remetente_tipo,texto,criado_em').eq('associado_id',aid).order('criado_em',{ascending:false}).order('id',{ascending:false}).range(pagina*30,pagina*30+30);if(error)throw error
  const msgs=(data||[]).slice(0,30),ids=msgs.map(m=>m.id)
  const {data:leituras,error:le}=ids.length?await db.from('clube_mensagens_leituras').select('mensagem_id').eq('leitor_tipo',tipo).eq('leitor_id',ator.id).in('mensagem_id',ids):{data:[],error:null};if(le)throw le
  return NextResponse.json({associado:a,mensagens:msgs.reverse().map(m=>({...m,lida:!!leituras?.some(l=>l.mensagem_id===m.id)})),mais:(data||[]).length>30},{headers:{'Cache-Control':'no-store'}})
 }
 if(req.method==='POST'){
  await limite(db,'mensagem:'+tipo+':'+ator.id,20)
  const b=mensagemSchema.parse(await req.json())
  const aid=tipo==='associado'?ator.id:z.string().uuid().parse(b.associado_id)
  if(tipo==='associado'&&b.associado_id&&b.associado_id!==ator.id)return NextResponse.json({error:'Conversa não permitida.'},{status:403})
  const {data:exist,error:ee}=await db.from('clube_mensagens').select('id,associado_id,remetente_tipo,remetente_id').eq('id',b.id).maybeSingle();if(ee)throw ee
  if(exist){if(exist.associado_id!==aid||exist.remetente_tipo!==tipo||exist.remetente_id!==ator.id)return NextResponse.json({error:'Identificador indisponível.'},{status:409});return NextResponse.json({ok:true})}
  const {error}=await db.from('clube_mensagens').insert({id:b.id,associado_id:aid,remetente_tipo:tipo,remetente_id:ator.id,texto:b.texto});if(error)throw error
  return NextResponse.json({ok:true},{status:201})
 }
 const b=leituraSchema.parse(await req.json()),aid=tipo==='associado'?ator.id:z.string().uuid().parse(b.associado_id)
 if(tipo==='associado'&&b.associado_id&&b.associado_id!==ator.id)return NextResponse.json({error:'Conversa não permitida.'},{status:403})
 const {data,error}=await db.from('clube_mensagens').select('id').eq('associado_id',aid).neq('remetente_tipo',tipo).in('id',b.ids);if(error)throw error
 if(data?.length){const {error:e}=await db.from('clube_mensagens_leituras').upsert(data.map(m=>({mensagem_id:m.id,leitor_tipo:tipo,leitor_id:ator.id})),{onConflict:'mensagem_id,leitor_tipo,leitor_id',ignoreDuplicates:true});if(e)throw e}
 const {data:total,error:ce}=await db.rpc('clube_mensagens_nao_lidas',{p_tipo:tipo,p_id:ator.id});if(ce)throw ce
 return NextResponse.json({ok:true,ids:(data||[]).map(m=>m.id),nao_lidas:Number(total||0)},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return falhaPortal('mensagens-'+req.method,e)}
}
