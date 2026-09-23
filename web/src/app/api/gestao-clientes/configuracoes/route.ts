import {NextRequest} from 'next/server'
import {z} from 'zod'
import {donoGestao,configGestao,asaasGestao,respostaGestao,erroGestao,ErroGestao} from '@/lib/gestao-licencas/servidor'
import {chaveMestra,cifrarCredencial} from '@/lib/gestao-licencas/credenciais'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(){try{
 const {db,cfg}=await donoGestao(undefined,true)
 const {data,error}=await db.from('gestao_credenciais').select('atualizado_em').eq('ambiente',cfg.ambiente).maybeSingle()
 if(error)throw error
 return respostaGestao({ambiente:cfg.ambiente,origem:data?'painel':'instalacao',atualizado_em:data?.atualizado_em||null,webhook:cfg.url+'/api/webhooks/asaas-licencas'})
 }catch(e){return erroGestao(e)}}
export async function POST(req:NextRequest){try{
 const {db,cfg,ator}=await donoGestao(req,true)
 const raw=await req.text();if(raw.length>10000)throw new ErroGestao(413,'Formulário muito grande.')
 let b;try{b=JSON.parse(raw)}catch{throw new ErroGestao(400,'Formulário inválido.')}
 if(b.acao==='testar'){
  const ativa=await configGestao()
  await asaasGestao(ativa,'/webhooks?limit=1')
  return respostaGestao({ok:true,mensagem:'Conexão com o Asaas confirmada.'})
 }
 const dados=z.object({acao:z.literal('salvar'),ambiente:z.enum(['sandbox','production']),chave:z.string().trim().min(20).max(4096).refine(s=>!/[\s\x00-\x1f]/.test(s))}).parse(b)
 if(dados.ambiente!==cfg.ambiente)throw new ErroGestao(409,'O ambiente da chave deve corresponder ao ambiente da instalação.')
 // Testa apenas leitura: salvar nunca emite cobrança nem retorna a chave.
 const mestra=await chaveMestra()
 await asaasGestao({...cfg,apiKey:dados.chave},'/webhooks?limit=1')
 const cifrada=cifrarCredencial(dados.chave,cfg.ambiente,mestra)
 const {error}=await db.rpc('gestao_salvar_credencial',{p_ambiente:cfg.ambiente,p_cifrada:cifrada,p_ator:ator.user.id})
 if(error)throw error
 return respostaGestao({ok:true,mensagem:'Chave validada e salva. A nova credencial já está em uso.'})
 }catch(e){if(e instanceof z.ZodError)return respostaGestao({error:'Confira a chave informada.'},400);return erroGestao(e)}}
