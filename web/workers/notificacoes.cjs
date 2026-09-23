const webpush=require('web-push')
const permitido=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.hash&&(u.hostname==='fcm.googleapis.com'||u.hostname==='web.push.apple.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com'))}catch{return false}}
module.exports=function iniciarPush(db){
 let parado=false,rodando=false
 async function tick(){
  if(parado||rodando)return;rodando=true
  try{
   const {data:config,error:ce}=await db.from('clube_push_config').select('public_key,private_key').eq('id',true).single();if(ce||!config)return
   const {data:jobs,error}=await db.rpc('clube_push_reservar');if(error)throw error
   for(const job of jobs||[]){
    if(parado)break
    let resultado='enviado',terminou=true
    const {data:s,error:se}=await db.from('clube_push_inscricoes').select('*').eq('id',job.inscricao_id).maybeSingle()
    try{
     if(se)throw se
     let ativo=false
     if(s?.dono_tipo==='associado'){
      const {data:ss,error:e}=await db.from('associado_app_sessoes').select('associado_id').eq('token_hash',s.sessao_hash).eq('associado_id',s.dono_id).eq('trocar_senha',false).gt('expira_em',new Date().toISOString()).maybeSingle()
      if(e)throw e;ativo=!!ss
     }else if(s){const {data:ok,error:e}=await db.rpc('clube_push_usuario_permitido',{p_usuario:s.dono_id});if(e)throw e;ativo=ok===true}
     if(!s||!ativo||!permitido(s.endpoint)){resultado='inativo'}
     else{
      await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.chave,auth:s.segredo}},JSON.stringify({tipo:s.dono_tipo}),{TTL:3600,timeout:8000,vapidDetails:{subject:'https://sistema.intellia.ia.br',publicKey:config.public_key,privateKey:config.private_key}})
     }
    }catch(e){
     if([404,410].includes(e.statusCode)){const {error:d}=await db.from('clube_push_inscricoes').delete().eq('id',job.inscricao_id);if(d)throw d;continue}
     terminou=job.tentativas>=6;resultado=terminou?'falhou':'tentar_novamente'
    }
    const {error:u}=await db.from('clube_push_fila').update({resultado,concluido_em:terminou?new Date().toISOString():null,disponivel_em:new Date(Date.now()+Math.min(3600,30*2**job.tentativas)*1000).toISOString()}).eq('id',job.id).eq('lease',job.lease)
    if(u)throw u
   }
  }catch{console.error('Notificações: tentativa adiada; verificar banco e conexão.')}
  finally{rodando=false}
 }
 const timer=setInterval(tick,10000);void tick()
 return async()=>{parado=true;clearInterval(timer);while(rodando)await new Promise(r=>setTimeout(r,100))}
}
module.exports.endpointPermitido=permitido
