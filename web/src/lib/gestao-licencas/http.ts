/** Respostas do proxy podem ser HTML/texto. Não as trate como JSON nem
 * repita um POST: ele pode ter sido concluído antes da conexão cair. */
export async function consultarGestao(body?:object){
 let r:Response
 try {
  r=await fetch('/api/gestao-clientes',{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'})
 }catch{
  throw Error(body?'A conexão foi interrompida. Atualize e confira se a operação foi concluída antes de tentar novamente.':'Não foi possível conectar ao painel. Confira a conexão e clique em Atualizar.')
 }
 if(r.headers.get('cf-mitigated')==='challenge')throw Error('O serviço de proteção solicitou uma verificação. Recarregue a página para continuar.')
 let j:any
 try{j=await r.json()}catch{
  throw Error(body?`O servidor não confirmou a operação (HTTP ${r.status}). Atualize e confira os dados antes de tentar novamente.`:`O servidor está temporariamente indisponível (HTTP ${r.status}). Clique em Atualizar para consultar novamente.`)
 }
 if(!r.ok)throw Error(j?.error||`Não foi possível concluir (HTTP ${r.status}).`)
 if(!j||typeof j!=='object')throw Error('O servidor retornou uma resposta inválida. Atualize a página.')
 return j
}
