import {NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {filaContatos} from '@/lib/fila-contatos'
export const dynamic='force-dynamic'
const resposta=(dados:object,status=200)=>NextResponse.json(dados,{status,headers:{'Cache-Control':'no-store'}})
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin)return resposta({error:'Origem não permitida.'},403)
 const acesso=await acessoRota('whatsapp','editar');if(!acesso?.admin)return resposta({error:'Somente administradores podem sincronizar contatos.'},403)
 try{
  const db=servicoAuditado(acesso.user.id)
  const {data,error}=await db.from('conversas_whatsapp').select('id').or('foto_perfil_url.is.null,nome_contato.is.null,nome_contato.eq.Desconhecido').order('id').limit(100)
  if(error)throw Error('consulta')
  if(!data?.length)return resposta({success:true,processados:0,message:'Nenhum contato pendente.'})
  const job=await filaContatos().add('sincronizar',{owner:acesso.user.id,ids:data.map(c=>c.id)},{deduplication:{id:acesso.user.id}})
  return resposta({success:true,jobId:job.id,status:'na_fila',message:'Sincronização recebida. Acompanhe o andamento.'},202)
 }catch{return resposta({error:'Não foi possível salvar a tarefa na fila. Tente novamente.'},503)}
}
export async function GET(request:Request){
 const acesso=await acessoRota('whatsapp');if(!acesso?.admin)return resposta({error:'Sem permissão.'},403)
 const id=new URL(request.url).searchParams.get('jobId')
 if(!id||!/^\d{1,20}$/.test(id))return resposta({error:'Informe o identificador da tarefa.'},400)
 try{
  const job=await filaContatos().getJob(id)
  if(!job||job.data.owner!==acesso.user.id)return resposta({error:'Tarefa não encontrada.'},404)
  const status=await job.getState()
  return resposta({jobId:id,status,progresso:job.progress,resultado:job.returnvalue,error:status==='failed'?'Sincronização falhou após as tentativas. Confira a configuração do provedor.':null})
 }catch{return resposta({error:'Fila temporariamente indisponível.'},503)}
}
