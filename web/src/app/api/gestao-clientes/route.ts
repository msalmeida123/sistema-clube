import {NextRequest} from 'next/server'
import {z} from 'zod'
import {clienteSchema,planoSchema,formaSchema,depositoSchema,linkCartaoSeguro,statusPagamento} from '@/lib/gestao-licencas/regras'
import {donoGestao,respostaGestao,erroGestao,ErroGestao,novaChave,hashChave,emitirCobranca,sincronizarCobranca,asaasGestao} from '@/lib/gestao-licencas/servidor'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(){try{
 const {db,cfg}=await donoGestao()
 const [p,c,b]=await Promise.all([db.from('gestao_planos').select('*').order('criado_em',{ascending:false}),db.from('gestao_clientes').select('id,nome,email,documento,dominio,instalacao,plano_id,instalacao_centavos,bloqueado,ambiente').eq('ambiente',cfg.ambiente).order('criado_em',{ascending:false}),db.from('gestao_cobrancas').select('id,cliente_id,tipo,forma,instrucoes_deposito,gestao_depositos(acao,ator,valor_centavos,data_recebimento,referencia,registrado_em),plano_nome,valor_centavos,dias,status,inicio,fim,asaas_id').eq('ambiente',cfg.ambiente).order('criada_em',{ascending:false}).limit(500)])
 if(p.error||c.error||b.error)throw Error()
 // A instalação paga não pode desaparecer quando sai das últimas 500 cobranças.
 const ids=(c.data||[]).map(cliente=>cliente.id)
 const instalacoes=ids.length?await db.from('gestao_cobrancas').select('cliente_id').in('cliente_id',ids).eq('tipo','instalacao').eq('status','RECEIVED'):{data:[],error:null}
 if(instalacoes.error)throw instalacoes.error
 const pagas=new Set((instalacoes.data||[]).map(i=>i.cliente_id))
 return respostaGestao({planos:p.data,clientes:c.data?.map(cliente=>({...cliente,instalacao_paga:pagas.has(cliente.id)})),cobrancas:b.data,ambiente:cfg.ambiente,url:cfg.url})
 }catch(e){return erroGestao(e)}}
export async function POST(req:NextRequest){try{
 const {db,cfg,ator}=await donoGestao(req)
 if(Number(req.headers.get('content-length')||0)>20000)throw new ErroGestao(413,'Formulário muito grande.')
 const b=await req.json()
 if(b.acao==='plano'||b.acao==='editar_plano'){
  const dados=planoSchema.parse(b.dados)
  const {error}=b.acao==='editar_plano'?await db.from('gestao_planos').update(dados).eq('id',z.string().uuid().parse(b.id)).select('id').single():await db.from('gestao_planos').insert(dados);if(error)throw error
  return respostaGestao({ok:true})
 }
 if(b.acao==='cliente'){
  const dados=clienteSchema.parse(b.dados),chave=novaChave()
  const {data:plano}=await db.from('gestao_planos').select('id').eq('id',dados.plano_id).eq('ativo',true).maybeSingle()
  if(!plano)throw new ErroGestao(400,'Selecione um plano ativo.')
  const {data,error}=await db.from('gestao_clientes').insert({...dados,ambiente:cfg.ambiente,chave_hash:hashChave(chave)}).select('id,instalacao').single()
  if(error){if(error.code==='23505')throw new ErroGestao(409,'Este domínio já está cadastrado.');throw error}
  await db.from('gestao_auditoria').insert({ator:ator.user.id,acao:'criar_cliente',cliente_id:data.id})
  return respostaGestao({ok:true,chave,instalacao:data.instalacao,central:cfg.url,dominio:dados.dominio})
 }
 const id=z.string().uuid().parse(b.id)
 if(b.acao==='trocar_plano'){
  const planoId=z.string().uuid().parse(b.plano_id)
  const {data:p}=await db.from('gestao_planos').select('id').eq('id',planoId).eq('ativo',true).maybeSingle()
  if(!p)throw new ErroGestao(400,'Selecione um plano ativo.')
  const {error}=await db.from('gestao_clientes').update({plano_id:planoId}).eq('id',id).eq('ambiente',cfg.ambiente).select('id').single();if(error)throw error
  await db.from('gestao_auditoria').insert({ator:ator.user.id,acao:'trocar_plano',cliente_id:id})
  return respostaGestao({ok:true})
 }
 if(b.acao==='cobrar'){const cobranca=await emitirCobranca(db,cfg,id,z.string().uuid().parse(b.pedido),z.enum(['instalacao','mensalidade']).parse(b.tipo),formaSchema.parse(b.forma||'PIX'),b.instrucoes_deposito===undefined?undefined:z.string().trim().min(10).max(1000).parse(b.instrucoes_deposito));return respostaGestao({ok:true,cobranca})}
 if(b.acao==='deposito'){
  const acao=z.enum(['confirmar','estornar','cancelar']).parse(b.operacao)
  const dados=acao==='confirmar'?depositoSchema.parse(b.dados):z.object({conferido:z.literal(true),valor_centavos:z.number().int().min(500),referencia:z.string().trim().min(3).max(200)}).parse(b.dados)
  const {error}=await db.rpc('gestao_registrar_deposito',{p_cobranca:id,p_ambiente:cfg.ambiente,p_ator:ator.user.id,p_acao:acao,p_valor:dados.valor_centavos,p_data:'data' in dados?dados.data:null,p_referencia:dados.referencia})
  if(error){if(error.code==='P0001')throw new ErroGestao(409,'Confira o valor, a data e a situação da cobrança.');throw error}
  return respostaGestao({ok:true,status:acao==='confirmar'?'RECEIVED':acao==='estornar'?'REFUNDED':'DELETED'})
 }
 if(b.acao==='suspender'||b.acao==='reativar'||b.acao==='chave'){
  const chave=b.acao==='chave'?novaChave():null
  const {data,error}=await db.from('gestao_clientes').update(chave?{chave_hash:hashChave(chave)}:{bloqueado:b.acao==='suspender'}).eq('id',id).eq('ambiente',cfg.ambiente).select('instalacao,dominio').single()
  if(error)throw new ErroGestao(404,'Cliente não encontrado.')
  await db.from('gestao_auditoria').insert({ator:ator.user.id,acao:b.acao,cliente_id:id})
  return respostaGestao({ok:true,...(chave?{chave,instalacao:data.instalacao,central:cfg.url,dominio:data.dominio}:{})})
 }
 if(b.acao==='consultar'||b.acao==='pix'||b.acao==='cartao'){
  const {data:c,error}=await db.from('gestao_cobrancas').select('*').eq('id',id).eq('ambiente',cfg.ambiente).single()
  if(error||!c.asaas_id)throw new ErroGestao(409,'Cobrança ainda em preparação.')
  if(b.acao==='pix'&&c.forma!=='PIX'||b.acao==='cartao'&&c.forma!=='CREDIT_CARD')throw new ErroGestao(409,'Forma de pagamento incompatível com esta cobrança.')
  const status=await sincronizarCobranca(db,cfg,c)
  if(b.acao==='cartao'&&['PENDING','OVERDUE'].includes(status)){
   const pagamento=await asaasGestao(cfg,'/payments/'+encodeURIComponent(c.asaas_id))
   statusPagamento(pagamento,c)
   return respostaGestao({status,link:linkCartaoSeguro(pagamento.invoiceUrl,cfg.ambiente)})
  }
  if(b.acao==='pix'&&status!=='RECEIVED'){
   const qr=await asaasGestao(cfg,'/payments/'+encodeURIComponent(c.asaas_id)+'/pixQrCode')
   if(typeof qr.encodedImage!=='string'||!/^[A-Za-z0-9+/=]+$/.test(qr.encodedImage)||typeof qr.payload!=='string')throw Error()
   return respostaGestao({status,imagem:qr.encodedImage,copiaCola:qr.payload})
  }
  return respostaGestao({ok:true,status})
 }
 throw new ErroGestao(400,'Ação inválida.')
 }catch(e){if(e instanceof z.ZodError)return respostaGestao({error:'Confira os campos preenchidos.'},400);return erroGestao(e)}}
