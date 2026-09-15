import {createHmac,timingSafeEqual} from 'node:crypto'
export function verificarAssinaturaStripe(raw:string,header:string,segredo:string,agora=Date.now()){
 const partes=header.split(',').map(x=>x.trim().split('='));const t=partes.find(x=>x[0]==='t')?.[1]
 if(!t||!/^\d+$/.test(t)||Math.abs(agora/1000-Number(t))>300)throw Error('Assinatura inválida')
 const esperado=createHmac('sha256',segredo).update(t+'.'+raw).digest()
 const ok=partes.filter(x=>x[0]==='v1'&&/^[0-9a-f]{64}$/i.test(x[1]||'')).some(x=>timingSafeEqual(esperado,Buffer.from(x[1],'hex')))
 if(!ok)throw Error('Assinatura inválida')
 return JSON.parse(raw)
}
export async function stripeAPI(chave:string,path:string,body?:Record<string,string>,idempotencia?:string){
 const r=await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+chave,'Stripe-Version':'2024-06-20',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotencia?{'Idempotency-Key':idempotencia}:{})},body:body?new URLSearchParams(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000),redirect:'error'})
 if(!r.ok)throw Error('Não foi possível concluir a consulta ao Stripe. Confira a configuração e tente novamente.')
 return r.json()
}
const id=(v:any)=>typeof v==='string'?v:v?.id
export async function confirmarFaturaStripe(db:any,config:any,invoiceId:string){
 if(!/^in_[a-zA-Z0-9]+$/.test(invoiceId))throw Error('Fatura inválida')
 const invoice=await stripeAPI(config.stripe_secret,'invoices/'+invoiceId)
 if(invoice.status!=='paid'||!invoice.paid)return {renovada:false}
 const subId=id(invoice.subscription);if(!/^sub_[a-zA-Z0-9]+$/.test(subId||''))return {renovada:false}
 const sub=await stripeAPI(config.stripe_secret,'subscriptions/'+subId)
 const licenseId=sub.metadata?.license_id
 if(!/^[0-9a-f-]{36}$/.test(licenseId||''))return {renovada:false}
 const {data:l,error}=await db.from('licenca_sistema').select('*').eq('id',licenseId).single()
 if(error||!l)return {renovada:false}
 if(l.stripe_subscription_id&&l.stripe_subscription_id!==subId)throw Error('Assinatura não corresponde à licença')
 if(l.stripe_customer_id&&l.stripe_customer_id!==id(invoice.customer))throw Error('Cliente não corresponde à licença')
 if(id(sub.customer)!==id(invoice.customer))throw Error('Cliente da fatura inválido')
 let linhas=invoice.lines?.data||[]
 if(invoice.lines?.has_more){linhas=[];let cursor='';do{const page=await stripeAPI(config.stripe_secret,'invoices/'+invoiceId+'/lines?limit=100'+(cursor?'&starting_after='+encodeURIComponent(cursor):''));linhas.push(...page.data);cursor=page.has_more?page.data.at(-1)?.id:'';if(linhas.length>1000)throw Error('Fatura excede o limite de itens')}while(cursor)}
 const fins=linhas.filter((x:any)=>x.type==='subscription'&&id(x.subscription)===subId&&id(x.price)===config.stripe_price&&Number.isSafeInteger(x.period?.end)&&x.period.end>0).map((x:any)=>x.period.end)
 if(!fins.length)return {renovada:false}
 const vencimento=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Math.max(...fins)*1000-1))
 const {data:renovada,error:err}=await db.rpc('licenca_confirmar_pagamento_stripe',{p_evento:'stripe:'+invoice.id,p_license_id:l.id,p_vencimento:vencimento,p_subscription:subId,p_customer:id(invoice.customer)})
 if(err)throw Error('Não foi possível registrar a renovação')
 return {renovada:!!renovada,data_vencimento:vencimento}
}
export async function verificarPagamentoLicenca(db:any,config:any,l:any){
 let subId=l.stripe_subscription_id
 if(!subId&&l.checkout_session_id){const s=await stripeAPI(config.stripe_secret,'checkout/sessions/'+encodeURIComponent(l.checkout_session_id));if(s.client_reference_id!==l.id)throw Error('Checkout não corresponde à licença');subId=id(s.subscription)}
 if(!subId)return {renovada:false,mensagem:'Pagamento ainda não confirmado.'}
 const sub=await stripeAPI(config.stripe_secret,'subscriptions/'+encodeURIComponent(subId));const invoice=id(sub.latest_invoice)
 return invoice?confirmarFaturaStripe(db,config,invoice):{renovada:false,mensagem:'Pagamento ainda não confirmado.'}
}
