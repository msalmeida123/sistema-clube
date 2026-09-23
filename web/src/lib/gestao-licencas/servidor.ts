import {readFile} from 'node:fs/promises'
import {createHash,randomBytes} from 'node:crypto'
import {z} from 'zod'
import {NextRequest,NextResponse} from 'next/server'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {appDb} from '@/lib/associado-app'
import {statusPagamento,FormaPagamento} from './regras'
import {chaveMestra,decifrarCredencial} from './credenciais'

const configSchema=z.object({ambiente:z.enum(['sandbox','production']),apiKey:z.string().min(20),webhookToken:z.string().min(32),proprietarios:z.array(z.string().uuid()).min(1),url:z.string().url().refine(v=>new URL(v).protocol==='https:')})
export class ErroGestao extends Error {constructor(public status:number,message:string){super(message);Object.setPrototypeOf(this,new.target.prototype)}}
class ErroAsaas extends ErroGestao {
 constructor(public rejeitada:boolean,statusProvedor:number,ambiente:string){
  // Falha conhecida da integração é uma dependência não atendida. Não usar 502:
  // proxies podem substituir esse JSON por uma página genérica, ocultando a causa.
  super([401,403].includes(statusProvedor)?409:424,[401,403].includes(statusProvedor)
   ?`O Asaas não autorizou a chave de API de ${ambiente==='sandbox'?'Sandbox':'produção'}. Atualize a credencial da gestão para gerar Pix ou cartão. Não envie a chave pelo chat.`
   :'O Asaas não concluiu a solicitação. Confira os dados e consulte novamente antes de emitir outra cobrança.')
 }
}
export const respostaGestao=(dados:unknown,status=200)=>NextResponse.json(dados,{status,headers:{'Cache-Control':'no-store'}})
export function erroGestao(e:unknown){return respostaGestao({error:e instanceof ErroGestao?e.message:'Não foi possível concluir. Confira a configuração e tente novamente.'},e instanceof ErroGestao?e.status:503)}
export async function configGestaoBase(){
 if(process.env.GESTAO_LICENCAS_ATIVA!=='1')throw new ErroGestao(404,'Página não disponível nesta instalação.')
 return configSchema.parse(JSON.parse(await readFile(process.env.GESTAO_LICENCAS_CONFIG||'/run/secrets/gestao_licencas','utf8')))
}
export async function configGestao(){
 const cfg=await configGestaoBase()
 const {data,error}=await appDb().from('gestao_credenciais').select('api_key_cifrada').eq('ambiente',cfg.ambiente).maybeSingle()
 if(error)throw error
 if(data)cfg.apiKey=await decifrarCredencial(data.api_key_cifrada,cfg.ambiente,await chaveMestra())
 return cfg
}
export async function donoGestao(req?:NextRequest,apenasBase=false){
 // Configurações precisam continuar acessíveis para reparar uma credencial.
 const cfg=await configGestaoBase()
 if(req&&req.method!=='GET'&&req.headers.get('origin')!==new URL(cfg.url).origin)throw new ErroGestao(403,'Origem não autorizada.')
 const ator=await acessoRota()
 // Um administrador de clube NÃO se torna proprietário do painel central.
 if(!ator||!cfg.proprietarios.includes(ator.user.id))throw new ErroGestao(403,'Acesso exclusivo do proprietário.')
 return {cfg:apenasBase?cfg:await configGestao(),ator,db:appDb()}
}
export const hashChave=(s:string)=>createHash('sha256').update(s).digest('hex')
export const novaChave=()=>`CLUBE_${randomBytes(32).toString('base64url')}`
export async function asaasGestao(cfg:Awaited<ReturnType<typeof configGestao>>,path:string,body?:object){
 const base=cfg.ambiente==='sandbox'?'https://api-sandbox.asaas.com/v3':'https://api.asaas.com/v3'
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{access_token:cfg.apiKey,'User-Agent':'SistemaClube-Licencas/1.0','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)})
 if(!r.ok)throw new ErroAsaas([400,401,403,404,422].includes(r.status),r.status,cfg.ambiente)
 return r.json()
}
export async function sincronizarCobranca(db:ReturnType<typeof appDb>,cfg:Awaited<ReturnType<typeof configGestao>>,c:any,evento?:string,tipo='CONSULTA'){
 if(c.ambiente!==cfg.ambiente||!c.asaas_id||c.forma==='DEPOSITO')throw new ErroGestao(409,'Cobrança não vinculada ao Asaas neste ambiente.')
 const consultado=new Date().toISOString()
 const p=await asaasGestao(cfg,'/payments/'+encodeURIComponent(c.asaas_id))
 const status=statusPagamento(p,c)
 const {error}=await db.rpc('gestao_confirmar_pagamento',{p_evento:cfg.ambiente+':'+(evento||`consulta:${c.id}:${status}`),p_tipo:tipo,p_cobranca:c.id,p_status:status,p_consultado:consultado})
 if(error)throw error
 return status
}

/** A primeira chamada cria; as seguintes apenas conciliam a referência fixa.
 * Uma resposta perdida do provedor não provoca nova cobrança ao clicar de novo. */
export async function emitirCobranca(db:ReturnType<typeof appDb>,cfg:Awaited<ReturnType<typeof configGestao>>,clienteId:string,pedido:string,tipo:'instalacao'|'mensalidade'='mensalidade',forma:FormaPagamento='PIX',instrucoes?:string){
 const {data:c,error:ce}=await db.from('gestao_clientes').select('*').eq('id',clienteId).single()
 if(ce||!c||c.ambiente!==cfg.ambiente)throw new ErroGestao(404,'Cliente não encontrado neste ambiente.')
 if(c.bloqueado)throw new ErroGestao(409,'Cliente suspenso. Reative antes de cobrar.')
 const {data:instalacoes,error:ie}=await db.from('gestao_cobrancas').select('id,status').eq('cliente_id',c.id).eq('tipo','instalacao').not('status','in','(REFUNDED,DELETED)')
 if(ie)throw ie
 if(tipo==='instalacao'&&!c.instalacao_centavos)throw new ErroGestao(409,'Este contrato não possui taxa de instalação.')
 if(tipo==='mensalidade'&&c.instalacao_centavos&&!instalacoes?.some(i=>i.status==='RECEIVED'))throw new ErroGestao(409,'Aguarde o pagamento da instalação antes de emitir a mensalidade.')
 // A instalação é cobrada uma vez. Cliques repetidos exibem a mesma cobrança.
 if(tipo==='instalacao'&&instalacoes?.some(i=>i.status==='RECEIVED'))return instalacoes.find(i=>i.status==='RECEIVED')!.id
 const {data:p,error:pe}=await db.from('gestao_planos').select('*').eq('id',c.plano_id).eq('ativo',true).single()
 if(pe||!p)throw new ErroGestao(409,'Plano indisponível.')
 if(forma==='DEPOSITO'&&(!instrucoes||instrucoes.trim().length<10||instrucoes.length>1000))throw new ErroGestao(400,'Informe os dados bancários para o depósito.')
 const {data:nova,error:ne}=await db.from('gestao_cobrancas').insert({id:pedido,cliente_id:c.id,tipo,forma,instrucoes_deposito:forma==='DEPOSITO'?instrucoes!.trim():null,status:forma==='DEPOSITO'?'PENDING':'PREPARANDO',plano_nome:p.nome,valor_centavos:tipo==='instalacao'?c.instalacao_centavos:p.valor_centavos,dias:tipo==='instalacao'?30:p.dias,ambiente:cfg.ambiente}).select('*').single()
 let cobranca=nova
 if(ne){
  if(ne.code!=='23505')throw ne
  const existente=await db.from('gestao_cobrancas').select('*').eq('id',pedido).eq('cliente_id',c.id).maybeSingle()
  if(existente.error)throw existente.error
  if(existente.data)cobranca=existente.data
  else {const {data:pendente,error}=await db.from('gestao_cobrancas').select('*').eq('cliente_id',c.id).in('status',['PREPARANDO','PENDING','OVERDUE','CONFIRMED']).single();if(error)throw error;cobranca=pendente}
 }
 if(!cobranca)throw Error()
 if(cobranca.tipo!==tipo)throw new ErroGestao(409,'Conclua a cobrança pendente antes de emitir outra modalidade.')
 if((cobranca.forma||'PIX')!==forma)throw new ErroGestao(409,'Já existe uma cobrança com outra forma de pagamento. Confira a cobrança pendente antes de continuar.')
 // Registro local pendente não quita nada. Apenas a confirmação auditada do
 // proprietário, em transação, transforma um depósito em período de licença.
 if(forma==='DEPOSITO')return cobranca.id as string
 if(!cobranca.asaas_id){
  const referencia=`licenca:${cobranca.id}`
  const encontrados=await asaasGestao(cfg,'/payments?externalReference='+encodeURIComponent(referencia))
  if(encontrados.totalCount>1)throw new ErroGestao(409,'Há mais de uma cobrança no Asaas para esta referência. Confira a conciliação.')
  let pagamento=encontrados.data?.[0]
  if(!pagamento){
   const {data:reserva,error:er}=await db.from('gestao_cobrancas').update({emissao_iniciada:true}).eq('id',cobranca.id).eq('emissao_iniciada',false).select('id').maybeSingle()
   if(er)throw er
   if(!reserva)throw new ErroGestao(409,'Emissão em andamento ou sem confirmação. Consulte novamente; nenhuma cobrança será duplicada.')
   let pagamentoSolicitado=false
   try {
   let customer=c.asaas_cliente
   if(!customer){
    const busca=await asaasGestao(cfg,'/customers?externalReference='+encodeURIComponent('cliente:'+c.id))
    if(busca.totalCount>1)throw new ErroGestao(409,'Confira o cadastro do cliente no Asaas.')
    const encontrado=busca.data?.[0]||await asaasGestao(cfg,'/customers',{name:c.nome,email:c.email,cpfCnpj:c.documento,externalReference:'cliente:'+c.id,notificationDisabled:true})
    customer=encontrado.id
    const {error}=await db.from('gestao_clientes').update({asaas_cliente:customer}).eq('id',c.id);if(error)throw error
   }
   pagamentoSolicitado=true
   pagamento=await asaasGestao(cfg,'/payments',{customer,billingType:forma,value:cobranca.valor_centavos/100,dueDate:new Date(Date.now()+7*86400000).toISOString().slice(0,10),description:`${tipo==='instalacao'?'Instalação':'Mensalidade'} Sistema Clube — ${cobranca.plano_nome} — ${cobranca.dias} dias`,externalReference:referencia})
   }catch(e){
    // Falha de credencial/dados não exige abandonar o pedido. Já uma resposta
    // incerta após POST /payments exige conciliar, nunca criar outra cobrança.
    if(!pagamentoSolicitado||e instanceof ErroAsaas&&e.rejeitada)await db.from('gestao_cobrancas').update({emissao_iniciada:false}).eq('id',cobranca.id)
    throw e
   }
  }
  const atualizado={...cobranca,asaas_id:pagamento.id,asaas_cliente:pagamento.customer}
  statusPagamento(pagamento,atualizado)
  // Confere também a conta do cliente; referência externa sozinha não autoriza.
  const {data:atual}=await db.from('gestao_clientes').select('asaas_cliente').eq('id',c.id).single()
  if(!atual?.asaas_cliente||pagamento.customer!==atual.asaas_cliente)throw Error('Cliente divergente')
  const {error}=await db.from('gestao_cobrancas').update({asaas_id:pagamento.id,asaas_cliente:pagamento.customer}).eq('id',cobranca.id);if(error)throw error
  cobranca=atualizado
 }
 await sincronizarCobranca(db,cfg,cobranca)
 return cobranca.id as string
}
