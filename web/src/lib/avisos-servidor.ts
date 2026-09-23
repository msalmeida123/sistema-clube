import {NextRequest,NextResponse} from 'next/server'
import {atorTema,origemTema,ErroTema,erroTema} from '@/lib/tema/servidor'
import {appDb,sessaoAssociado,limite} from '@/lib/associado-app'
import {prepararFundo,MAX_FUNDO} from '@/lib/tema/fundo'
import {tempoAvisosSchema,novoAvisoSchema,acaoAvisoSchema,avisoId,expiraAviso,avisoDisponivel} from '@/lib/avisos-aplicativo'
const campos='id,titulo,descricao,ativo,expira_em,publicado_em,criado_em'
const json=(d:unknown,status=200)=>NextResponse.json(d,{status,headers:{'Cache-Control':'no-store'}})
function erro(e:unknown){if(e instanceof Error&&e.name==='ZodError')return json({error:'Confira o título, a validade e a imagem.'},422);return e instanceof ErroTema?erroTema(e):json({error:'Não foi possível consultar ou atualizar os avisos. Tente novamente.'},503)}
async function lerUpload(req:NextRequest){
 const reader=req.body?.getReader();if(!reader)throw new ErroTema(422,'Selecione uma imagem.')
 let bytes=0;const chunks:Uint8Array[]=[]
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>MAX_FUNDO+32768){await reader.cancel();throw new ErroTema(413,'Use uma imagem de até 8 MB.')}chunks.push(value)}
 try{return await new Response(Buffer.concat(chunks),{headers:{'content-type':req.headers.get('content-type')||''}}).formData()}catch{throw new ErroTema(422,'Confira os dados do aviso.')}
}
/** Administração: sessão e clube do administrador, nunca clube informado pelo navegador. */
export async function avisosAdmin(req:NextRequest){try{
 if(req.method!=='GET')origemTema(req)
 const ator=await atorTema(),db=appDb()
 if(req.method==='GET'){
  if(req.nextUrl.searchParams.has('imagem'))return await imagemAviso(req,db,ator.clube,false)
  const pagina=Math.max(0,Math.min(10000,Number(req.nextUrl.searchParams.get('pagina'))||0))
  const {data,error}=await db.from('clube_avisos').select(campos).eq('clube_id',ator.clube).order('criado_em',{ascending:false}).order('id').range(pagina*30,pagina*30+30)
  if(error)throw error;return json({avisos:(data||[]).slice(0,30),mais:(data||[]).length>30})
 }
 await limite(db,`avisos-admin:${ator.user.id}`,30)
 if(req.method==='POST'){
  const form=await lerUpload(req)
  if(Array.from(form.keys()).some(k=>!['id','titulo','descricao','validade','imagem'].includes(k)||form.getAll(k).length!==1))throw new ErroTema(422,'Confira os dados do aviso.')
  const b=novoAvisoSchema.parse({id:form.get('id'),titulo:form.get('titulo'),descricao:form.get('descricao')||'',validade:form.get('validade')||''})
  let expira_em:string|null
  try{expira_em=expiraAviso(b.validade)}catch{throw new ErroTema(422,'Informe uma data válida.')}
  if(expira_em&&Date.parse(expira_em)<=Date.now())throw new ErroTema(422,'A validade deve ser hoje ou uma data futura.')
  const {data:exist,error:ee}=await db.from('clube_avisos').select('id,clube_id,criado_por').eq('id',b.id).maybeSingle();if(ee)throw ee
  if(exist){if(exist.clube_id!==ator.clube||exist.criado_por!==ator.user.id)throw new ErroTema(409,'Identificador indisponível.');return json({id:exist.id})}
  const file=form.get('imagem');if(!file||typeof file==='string')throw new ErroTema(422,'Selecione a imagem do aviso.')
  let imagem:string
  try{imagem=await prepararFundo(file)}catch{throw new ErroTema(422,'Use JPG, PNG ou WEBP sem animação, até 8 MB e pelo menos 320 pixels em cada dimensão.')}
  const {error}=await db.from('clube_avisos').insert({id:b.id,clube_id:ator.clube,titulo:b.titulo,descricao:b.descricao,expira_em,imagem,criado_por:ator.user.id,atualizado_por:ator.user.id})
  if(error){if(error.code==='23505')throw new ErroTema(409,'Este rascunho já foi salvo. Atualize a lista.');throw error}
  return json({id:b.id},201)
 }
 const b=acaoAvisoSchema.parse(await req.json())
 const {data:aviso,error:ae}=await db.from('clube_avisos').select('id,expira_em,ativo,publicado_em').eq('id',b.id).eq('clube_id',ator.clube).maybeSingle()
 if(ae)throw ae;if(!aviso)throw new ErroTema(404,'Aviso não encontrado.')
 if(b.acao==='publicar'&&aviso.expira_em&&Date.parse(aviso.expira_em)<=Date.now())throw new ErroTema(422,'Este aviso venceu. Cadastre um novo aviso com validade atualizada.')
 const {error}=await db.from('clube_avisos').update({ativo:b.acao==='publicar',...(b.acao==='publicar'&&!aviso.publicado_em?{publicado_em:new Date().toISOString()}:{}),atualizado_por:ator.user.id,atualizado_em:new Date().toISOString()}).eq('id',b.id).eq('clube_id',ator.clube)
 if(error)throw error
 return json({ok:true})
}catch(e){return erro(e)}}
async function imagemAviso(req:NextRequest,db:ReturnType<typeof appDb>,clube:string,somenteAtivos:boolean){
 const id=avisoId.parse(req.nextUrl.searchParams.get('imagem'))
 const {data,error}=await db.from('clube_avisos').select('imagem,ativo,expira_em').eq('id',id).eq('clube_id',clube).maybeSingle()
 if(error)throw error;if(!data||somenteAtivos&&!avisoDisponivel(data))throw new ErroTema(404,'Aviso não encontrado.')
 return new Response(new Uint8Array(Buffer.from(data.imagem,'base64')),{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
}
/** Associado: a sessão define tanto o destinatário do fechamento quanto o clube. */
export async function avisosAssociado(req:NextRequest){try{
 if(req.method!=='GET')origemTema(req)
 const sessao=await sessaoAssociado(req);if(!sessao)return json({error:'Entre novamente.'},401)
 const {db,associado:a}=sessao;if(!a.clube_id)return json({error:'Clube não encontrado.'},403)
 if(req.method==='GET'){
  if(req.nextUrl.searchParams.has('imagem'))return await imagemAviso(req,db,a.clube_id,true)
  const {data,error}=await db.from('clube_avisos').select(campos).eq('clube_id',a.clube_id).eq('ativo',true).or(`expira_em.is.null,expira_em.gt.${new Date().toISOString()}`).order('publicado_em',{ascending:false}).order('id').limit(100)
  if(error)throw error
  const ids=(data||[]).map(x=>x.id)
  const {data:fechados,error:fe}=ids.length?await db.from('clube_avisos_fechamentos').select('aviso_id').eq('associado_id',a.id).in('aviso_id',ids):{data:[],error:null}
  if(fe)throw fe
  const tempo_segundos=await lerTempoAvisos(db,a.clube_id)
  return json({tempo_segundos,avisos:(data||[]).map(x=>({...x,fechado:!!fechados?.some(f=>f.aviso_id===x.id)}))})
 }
 await limite(db,`aviso-fechar:${a.id}`,60)
 const b=await req.json();const id=avisoId.parse(b.id)
 if(Object.keys(b).some(k=>k!=='id'))throw new ErroTema(422,'Solicitação inválida.')
 const {data,error}=await db.from('clube_avisos').select('id').eq('id',id).eq('clube_id',a.clube_id).eq('ativo',true).maybeSingle();if(error)throw error;if(!data)throw new ErroTema(404,'Aviso não encontrado.')
 const {error:fe}=await db.from('clube_avisos_fechamentos').upsert({aviso_id:id,associado_id:a.id},{onConflict:'aviso_id,associado_id',ignoreDuplicates:true})
 if(fe)throw fe;return json({ok:true})
}catch(e){return erro(e)}}

async function lerTempoAvisos(db:ReturnType<typeof appDb>,clube:string){
 const {data,error}=await db.from('clube_avisos_config').select('tempo_segundos').eq('clube_id',clube).maybeSingle()
 if(error)throw error
 return tempoAvisosSchema.parse({tempo_segundos:data?.tempo_segundos??0}).tempo_segundos
}
export async function configurarTempoAvisos(req:NextRequest){try{
 if(req.method!=='GET')origemTema(req)
 const ator=await atorTema(),db=appDb()
 if(req.method==='GET')return json({tempo_segundos:await lerTempoAvisos(db,ator.clube)})
 const parsed=tempoAvisosSchema.safeParse(await req.json())
 if(!parsed.success)throw new ErroTema(422,'Escolha de 1 a 60 segundos ou desative o fechamento automático.')
 await limite(db,`avisos-tempo:${ator.user.id}`,30)
 const {error}=await db.from('clube_avisos_config').upsert({clube_id:ator.clube,tempo_segundos:parsed.data.tempo_segundos,atualizado_por:ator.user.id,atualizado_em:new Date().toISOString()},{onConflict:'clube_id'})
 if(error)throw error
 return json({ok:true,...parsed.data})
}catch(e){return erro(e)}}
