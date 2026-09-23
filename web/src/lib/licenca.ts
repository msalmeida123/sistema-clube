export type LicencaSistema={id:string;empresa:string;data_vencimento:string;renovar_url:string|null;assinatura_url:string|null}
export const ANTECEDENCIAS_LICENCA=[15,7,3,1,0]
export function diasLicenca(vencimento:string,agora=new Date()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)||new Date(vencimento+'T00:00:00Z').toISOString().slice(0,10)!==vencimento)throw Error('Vencimento inválido')
 const hoje=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(agora)
 return Math.round((Date.parse(vencimento+'T00:00:00Z')-Date.parse(hoje+'T00:00:00Z'))/86400000)
}
export function estadoLicenca(dias:number){return dias<0?'VENCIDA':dias<=15?'VENCENDO':'VÁLIDA'}
export function mensagemLicenca(data:string,dias:number){const exibida=data.split('-').reverse().join('/');return `ATENÇÃO: A licença do Sistema Clube ${dias===0?'vence hoje':dias===1?'vence em 1 dia':`vence em ${dias} dias`}, no dia ${exibida}.\n\nPara evitar a interrupção do sistema, realize a renovação da assinatura.\n\nApós a confirmação do pagamento, a licença será renovada automaticamente.`}
export function validarAntecedencias(valor:unknown):number[]{if(!Array.isArray(valor)||!valor.length||valor.length>30||valor.some(v=>!Number.isInteger(v)||v<0||v>365))throw Error('Informe de 1 a 30 antecedências entre 0 e 365 dias.');return Array.from(new Set<number>(valor)).sort((a,b)=>b-a)}
export function linkLicenca(valor:string|null){if(!valor)return null;try{const url=new URL(valor);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}}

