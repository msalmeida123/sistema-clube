import {NextRequest} from 'next/server'
import {z} from 'zod'
import {appDb} from '@/lib/associado-app'
import {configGestao,hashChave,respostaGestao,erroGestao} from '@/lib/gestao-licencas/servidor'
import {periodoAtivo} from '@/lib/gestao-licencas/regras'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const schema=z.object({instalacao:z.string().uuid(),dominio:z.string().min(3).max(253),ambiente:z.enum(['sandbox','production'])})
export async function POST(req:NextRequest){try{
 const cfg=await configGestao()
 if(Number(req.headers.get('content-length')||0)>4096)return respostaGestao({ativo:false},413)
 const chave=req.headers.get('authorization')?.replace(/^Bearer /,'')||''
 if(!/^CLUBE_[A-Za-z0-9_-]{43}$/.test(chave))return respostaGestao({ativo:false},401)
 const b=schema.safeParse(await req.json());if(!b.success)return respostaGestao({ativo:false},400)
 // Licenças pagas em Sandbox nunca ativam instalações de produção.
 if(b.data.ambiente!==cfg.ambiente)return respostaGestao({ativo:false},403)
 const db=appDb()
 const {data:c,error}=await db.from('gestao_clientes').select('id,bloqueado,instalacao_centavos').eq('chave_hash',hashChave(chave)).eq('instalacao',b.data.instalacao).eq('dominio',b.data.dominio).eq('ambiente',cfg.ambiente).maybeSingle()
 if(error)throw error
 if(!c)return respostaGestao({ativo:false},401)
 if(c.bloqueado)return respostaGestao({ativo:false,motivo:'suspensa'},403)
 if(c.instalacao_centavos){
  // Um estorno da instalação revoga a primeira liberação, inclusive quando há
  // mensalidades antecipadas. Contratos antigos sem taxa mantêm sua regra.
  const {data:i,error:ie}=await db.from('gestao_cobrancas').select('id').eq('cliente_id',c.id).eq('tipo','instalacao').eq('status','RECEIVED').maybeSingle()
  if(ie)throw ie
  if(!i)return respostaGestao({ativo:false,motivo:'aguardando_instalacao'},402)
 }
 const {data:ps,error:pe}=await db.from('gestao_cobrancas').select('status,inicio,fim,plano_nome').eq('cliente_id',c.id).eq('status','RECEIVED').lte('inicio',new Date().toISOString()).gt('fim',new Date().toISOString()).order('fim',{ascending:false}).limit(1)
 if(pe)throw pe
 const p=periodoAtivo(ps||[])
 return respostaGestao({ativo:!!p,ambiente:cfg.ambiente,vencimento:p?.fim||null,motivo:p?'ativa':'aguardando_pagamento'},p?200:402)
 }catch(e){return erroGestao(e)}}
