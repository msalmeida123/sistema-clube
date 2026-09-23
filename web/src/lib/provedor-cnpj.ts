import {normalizarCnpj} from './cnpj'
/** Fontes públicas independentes. Nunca repassar cookies ou credenciais do clube. */
export async function consultarProvedorCnpj(cnpj:string){
 let ausentes=0
 for(const url of [`https://minhareceita.org/${cnpj}`,`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`]){
  try{
   const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000),redirect:'error',cache:'no-store'})
   if(r.status===404){ausentes++;continue}
   if(!r.ok||!r.headers.get('content-type')?.includes('application/json'))continue
   const d=await r.json()
   if(typeof d.razao_social==='string'&&d.razao_social.trim()&&normalizarCnpj(String(d.cnpj))===cnpj)return d
  }catch{/* Consultar a próxima fonte em caso de timeout ou resposta inválida. */}
 }
 throw Error(ausentes===2?'nao_encontrado':'provedor')
}
