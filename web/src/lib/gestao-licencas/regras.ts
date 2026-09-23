import {z} from 'zod'

export const planoSchema=z.object({nome:z.string().trim().min(2).max(80),valor_centavos:z.number().int().min(500).max(100000000),dias:z.number().int().min(1).max(366)})
export const clienteSchema=z.object({
 nome:z.string().trim().min(2).max(150),email:z.string().email().max(200),
 documento:z.string().transform(s=>s.replace(/\D/g,'')).refine(s=>s.length===11||s.length===14),
 dominio:z.string().trim().toLowerCase().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/),
 plano_id:z.string().uuid(),
 instalacao_centavos:z.number().int().min(500).max(100000000),
})
export const formaSchema=z.enum(['PIX','CREDIT_CARD','DEPOSITO'])
export type FormaPagamento=z.infer<typeof formaSchema>
export const depositoSchema=z.object({conferido:z.literal(true),valor_centavos:z.number().int().min(500),referencia:z.string().trim().min(3).max(200),data:z.string().date().refine(d=>d<=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}),'Data futura')})
export function statusPagamento(p:any,c:{asaas_id:string;asaas_cliente:string;id:string;valor_centavos:number;forma?:string}){
 const forma=c.forma||'PIX'
 const confereForma=forma==='PIX'?p?.billingType==='PIX':forma==='CREDIT_CARD'&&['CREDIT_CARD','DEBIT_CARD'].includes(p?.billingType)
 if(p?.id!==c.asaas_id||p.customer!==c.asaas_cliente||p.externalReference!==`licenca:${c.id}`||!confereForma||!Number.isFinite(p.value)||Math.round(p.value*100)!==c.valor_centavos)throw Error('Pagamento divergente')
 // RECEIVED é a quitação local. Para cartão, CONFIRMED já significa pagamento
 // capturado; aguardar o repasse do Asaas impediria a liberação por semanas.
 let status=p.deleted?'DELETED':p.refundedValue>0?'PARTIALLY_REFUNDED':p.status
 if(forma==='CREDIT_CARD'){
  if(status==='CONFIRMED')status='RECEIVED'
  if(['AUTHORIZED','AWAITING_RISK_ANALYSIS'].includes(status))status='PENDING'
  if(['CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL'].includes(status))status='REFUND_IN_PROGRESS'
 }
 if(!['PENDING','CONFIRMED','RECEIVED','OVERDUE','REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS','PARTIALLY_REFUNDED','DELETED'].includes(status))throw Error('Status não suportado')
 return status as string
}
export function linkCartaoSeguro(link:unknown,ambiente:string){
 if(typeof link!=='string')throw Error('Link indisponível')
 const u=new URL(link)
 const hosts=ambiente==='sandbox'?['sandbox.asaas.com']:['www.asaas.com','asaas.com']
 if(u.protocol!=='https:'||!hosts.includes(u.hostname)||u.username||u.password||u.port||!u.pathname.startsWith('/i/'))throw Error('Link de pagamento inválido')
 return u.href
}
export function periodoAtivo(cobrancas:{status:string;inicio:string|null;fim:string|null}[],agora=Date.now()){
 return cobrancas.filter(c=>c.status==='RECEIVED'&&c.inicio&&c.fim&&Date.parse(c.inicio)<=agora&&Date.parse(c.fim)>agora).sort((a,b)=>Date.parse(b.fim!)-Date.parse(a.fim!))[0]||null
}
