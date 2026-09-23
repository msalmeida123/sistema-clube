export async function lerRespostaCnpj(r:Response){
 if(r.status===401||r.redirected&&new URL(r.url).pathname==='/login')throw Error('Sua sessão expirou. Entre novamente no sistema para consultar o CNPJ.')
 if(!r.headers.get('content-type')?.includes('application/json'))throw Error('A consulta de CNPJ não respondeu corretamente. Atualize a página e tente novamente.')
 let d:any;try{d=await r.json()}catch{throw Error('A consulta de CNPJ retornou uma resposta inválida. Tente novamente.')}
 if(!r.ok)throw Error(typeof d?.error==='string'?d.error:'Não foi possível consultar o CNPJ.')
 if(typeof d?.nome!=='string'||!d.nome.trim()||typeof d?.cnpj!=='string')throw Error('Os dados da empresa estão incompletos. Tente novamente.')
 return d
}
