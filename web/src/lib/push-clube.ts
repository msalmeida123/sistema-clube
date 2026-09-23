import {falhaPortal} from './portal-servidor'
import {NextRequest,NextResponse} from 'next/server'
import {z} from 'zod'
import {atorMensagem,origemMensagem} from './mensagens-clube'
export function endpointPushPermitido(s:string){
 try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(h=>u.hostname===h||(h==='updates.push.services.mozilla.com'&&u.hostname.endsWith('.push.services.mozilla.com')))}catch{return false}
}
export const inscricaoSchema=z.object({endpoint:z.string().max(2000).refine(endpointPushPermitido),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87,88}={0,2}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/)})})
export async function endpointNotificacoes(req:NextRequest,tipo:'associado'|'equipe'){
 if(req.method!=='GET'&&!origemMensagem(req))return NextResponse.json({error:'Origem não permitida.'},{status:403})
 try{
 const a=await atorMensagem(req,tipo);if(!a)return NextResponse.json({error:'Entre novamente ou confira sua permissão.'},{status:tipo==='associado'?401:403})
 if(req.method==='GET'){const {data,error}=await a.db.from('clube_push_config').select('public_key').eq('id',true).single();if(error)throw error;return NextResponse.json({publicKey:data.public_key},{headers:{'Cache-Control':'no-store'}})}
 if(req.method==='DELETE'){
 const b=z.object({endpoint:z.string().max(2000)}).parse(await req.json())
 const {error}=await a.db.from('clube_push_inscricoes').delete().eq('endpoint',b.endpoint).eq('dono_tipo',tipo).eq('dono_id',a.id);if(error)throw error
 return NextResponse.json({ok:true})
 }
 const b=inscricaoSchema.parse(await req.json())
 const {data:atual,error:e}=await a.db.from('clube_push_inscricoes').select('id,dono_id,dono_tipo').eq('endpoint',b.endpoint).maybeSingle();if(e)throw e
 if(atual&&(atual.dono_id!==a.id||atual.dono_tipo!==tipo))return NextResponse.json({error:'Desative as notificações deste site no navegador e ative novamente nesta conta.',code:'PUSH_CONTA'},{status:409})
 if(!atual){const {count,error}=await a.db.from('clube_push_inscricoes').select('id',{head:true,count:'exact'}).eq('dono_tipo',tipo).eq('dono_id',a.id);if(error)throw error;if((count||0)>=10)return NextResponse.json({error:'Limite de dez dispositivos. Desative um dispositivo anterior.',code:'PUSH_LIMITE'},{status:400})}
 const {data:salvo,error}=await a.db.rpc('clube_push_salvar',{p_endpoint:b.endpoint,p_chave:b.keys.p256dh,p_segredo:b.keys.auth,p_tipo:tipo,p_id:a.id,p_sessao:a.session});if(error)throw error
 if(!salvo)return NextResponse.json({error:'Dispositivo vinculado a outra conta. Desative e ative novamente.'},{status:409})
 return NextResponse.json({ok:true})
 }catch(e){return falhaPortal('notificacoes-'+req.method,e)}
}
