// Compatível com Edge: sem banco, Node crypto ou acesso a arquivos.
// O segredo é injetado no processo pelo entrypoint Docker, nunca NEXT_PUBLIC.
let cache:{chave:string;ate:number;vencimento:number}|undefined
export async function verificarLicencaCliente(){
 if(process.env.LICENCA_EXIGIR!=='1')return {status:200}
 const central=process.env.LICENCA_CENTRAL_URL,token=process.env.LICENCA_CHAVE,instalacao=process.env.LICENCA_INSTALACAO,dominio=process.env.LICENCA_DOMINIO,ambiente=process.env.LICENCA_AMBIENTE||'production'
 if(!central||!token||!instalacao||!dominio)return {status:503}
 let url:URL;try{url=new URL('/api/licencas/validar',central);if(url.protocol!=='https:'||url.username||url.password)return {status:503}}catch{return {status:503}}
 const chave=[central,token,instalacao,dominio,ambiente].join('|')
 if(cache?.chave===chave&&cache.ate>Date.now()&&cache.vencimento>Date.now())return {status:200}
 try{
  const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({instalacao,dominio,ambiente}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)})
  if([401,402,403].includes(r.status)){cache=undefined;return {status:402}}
  if(!r.ok)return {status:503}
  const j=await r.json(),vencimento=Date.parse(j.vencimento)
  if(j.ativo!==true||j.ambiente!==ambiente||!Number.isFinite(vencimento)||vencimento<=Date.now())return {status:402}
  cache={chave,ate:Date.now()+60000,vencimento};return {status:200}
 }catch{return {status:503}}
}
