import {readFile} from 'node:fs/promises'
import {createHash,timingSafeEqual} from 'node:crypto'

// Credenciais montadas por Docker Secret. Não importar em componentes client.
export async function configuracaoSandbox(){
 const c=JSON.parse(await readFile('/run/secrets/asaas_sandbox','utf8'))
 if(c.ambiente!=='sandbox'||typeof c.apiKey!=='string'||typeof c.webhookToken!=='string'||c.webhookToken.length<32)throw Error('configuracao_indisponivel')
 return c as {apiKey:string;webhookToken:string}
}
export function tokenAsaasValido(recebido:string,esperado:string){
 return !!recebido&&esperado.length>=32&&timingSafeEqual(createHash('sha256').update(recebido).digest(),createHash('sha256').update(esperado).digest())
}
export async function consultarPagamentoSandbox(chave:string,id:string){
 const r=await fetch('https://api-sandbox.asaas.com/v3/payments/'+encodeURIComponent(id),{
  headers:{access_token:chave,'User-Agent':'SistemaClube/1.0'},cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'error',
 })
 if(!r.ok)throw Error('asaas_indisponivel')
 return r.json()
}
export function conferirPagamentoSandbox(p:any,c:{id:string;referencia:string;cliente:string;valor:number|string}){
 if(p?.id!==c.id||p?.customer!==c.cliente||p?.externalReference!==c.referencia||p?.billingType!=='PIX'||typeof p?.value!=='number'||!Number.isFinite(p.value)||Math.round(p.value*100)!==Math.round(Number(c.valor)*100))throw Error('pagamento_divergente')
 if(!['PENDING','RECEIVED','CONFIRMED','OVERDUE','REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS','DELETED'].includes(p.status))throw Error('status_desconhecido')
 return p.deleted?'DELETED':p.status as string
}
