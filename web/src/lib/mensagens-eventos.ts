export type TipoLeitor='associado'|'equipe'
export const EVENTO_LEITURA='clube:mensagens-lidas'
export const EVENTO_SESSAO='clube:sessao-expirada'
export function avisarLeitura(tipo:TipoLeitor,total:number){
 if(!Number.isSafeInteger(total)||total<0)return
 window.dispatchEvent(new CustomEvent(EVENTO_LEITURA,{detail:{tipo,total}}))
 // Outras abas consultam seu próprio backend; nenhuma identidade ou mensagem é compartilhada.
 if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel(EVENTO_LEITURA);c.postMessage({tipo});c.close()}
}
