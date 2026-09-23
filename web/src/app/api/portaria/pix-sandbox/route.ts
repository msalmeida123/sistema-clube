import {NextRequest,NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {appDb} from '@/lib/associado-app'
import {configuracaoSandbox} from '@/lib/asaas-sandbox'
export const dynamic='force-dynamic'
export const runtime='nodejs'
const resposta=(data:object,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})

/** Demonstração administrativa isolada; não recebe IDs de mensalidades reais. */
export async function GET(req:NextRequest){
 const acesso=await acessoRota('financeiro','editar')
 if(!acesso?.admin)return resposta({error:'Teste disponível somente para administrador autorizado.'},403)
 const setor=req.nextUrl.searchParams.get('setor')
 if(setor!=='academia'&&setor!=='clube')return resposta({error:'Setor inválido.'},400)
 try{
  const {data:c,error}=await appDb().from('asaas_sandbox_cobrancas').select('id,valor,status,atualizado_em').eq('referencia',`clube-homologacao-${setor}-5reais-v1`).maybeSingle()
  if(error)throw error
  if(!c)return resposta({error:'Cobrança de teste ainda não preparada.'},404)
  const resumo={id:c.id,valor:Number(c.valor),status:c.status,atualizadoEm:c.atualizado_em,ambiente:'sandbox'}
  if(req.nextUrl.searchParams.get('status')==='1'||c.status==='RECEIVED')return resposta(resumo)
  const cfg=await configuracaoSandbox()
  const r=await fetch(`https://api-sandbox.asaas.com/v3/payments/${encodeURIComponent(c.id)}/pixQrCode`,{headers:{access_token:cfg.apiKey,'User-Agent':'SistemaClube/1.0'},cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'error'})
  if(!r.ok)throw Error()
  const qr=await r.json()
  if(typeof qr.encodedImage!=='string'||!qr.encodedImage||!/^[A-Za-z0-9+/=]+$/.test(qr.encodedImage)||typeof qr.payload!=='string')throw Error()
  return resposta({...resumo,imagem:qr.encodedImage,copiaCola:qr.payload})
 }catch{return resposta({error:'Não foi possível carregar o Pix de teste. Tente novamente.'},503)}
}
