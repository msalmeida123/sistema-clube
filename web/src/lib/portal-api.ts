/** Respostas externas nunca são usadas como texto de interface. */
const textos:Record<string,string>={
 CREDENCIAIS:'CPF ou senha inválidos.',
 SENHA_TAMANHO:'Use uma senha com 10 a 128 caracteres.',
 REDEFINIR:'Para redefinir, solicite uma nova senha temporária no acesso.',
 CPF:'Informe um CPF com 11 dígitos.',
 PUSH_CONTA:'Desative as notificações deste site no navegador e ative novamente nesta conta.',
 PUSH_LIMITE:'Limite de dez dispositivos. Desative um dispositivo anterior.',
}
export class ErroPortal extends Error {constructor(message:string,public status=0){super(message);Object.setPrototypeOf(this,new.target.prototype);this.name='ErroPortal'}}
export function mensagemPortal(e:unknown){return e instanceof ErroPortal?e.message:'Não foi possível concluir. Tente novamente.'}
export function erroCancelado(e:unknown){return e instanceof Error&&e.name==='AbortError'}
function porStatus(status:number,login=false){
 if(status===401)return login?'CPF ou senha inválidos.':'Sua sessão expirou. Entre novamente.'
 if(status===403)return 'Não foi possível autorizar seu acesso. Atualize a página e tente novamente. Se continuar, entre em contato com a secretaria do clube.'
 if(status===404)return 'Não foi possível encontrar as informações. Tente novamente.'
 if(status===400||status===422)return 'Confira os dados preenchidos e tente novamente.'
 if(status===429)return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
 if(status>=500)return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.'
 return 'Não foi possível carregar as informações. Tente novamente.'
}
export async function portalApi<T=any>(url:string,init:RequestInit={},opcoes:{login?:boolean;timeoutMs?:number}={}):Promise<T>{
 const controller=new AbortController();let timeout=false
 const cancelar=()=>controller.abort();if(init.signal?.aborted)cancelar();else init.signal?.addEventListener('abort',cancelar,{once:true})
 const timer=setTimeout(()=>{timeout=true;controller.abort()},opcoes.timeoutMs??20000)
 try{
  const r=await fetch(url,{...init,cache:'no-store',credentials:'same-origin',redirect:'error',signal:controller.signal,headers:{Accept:'application/json',...init.headers}})
  const ok=r.ok,status=r.status,json=/^application\/(?:[\w.-]+\+)?json(?:;|$)/i.test(r.headers.get('content-type')||'')
  if(!json)throw new ErroPortal(porStatus(ok?503:status,opcoes.login),ok?503:status)
  let data:any
  try{data=await r.json()}catch{throw new ErroPortal(porStatus(ok?503:status,opcoes.login),ok?503:status)}
  if(!ok)throw new ErroPortal(textos[data?.code]||porStatus(status,opcoes.login),status)
  if(!data||typeof data!=='object'||Array.isArray(data))throw new ErroPortal(porStatus(503),503)
  return data as T
 }catch(e){
  if(init.signal?.aborted)throw new DOMException('Cancelado','AbortError')
  if(e instanceof ErroPortal)throw e
  throw new ErroPortal(timeout?'O serviço demorou para responder. Tente novamente.':'Não foi possível conectar. Verifique sua conexão e tente novamente.')
 }finally{clearTimeout(timer);init.signal?.removeEventListener('abort',cancelar)}
}
