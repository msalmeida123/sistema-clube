const {Worker,UnrecoverableError}=require('bullmq')
const {createClient}=require('@supabase/supabase-js')
const {writeFileSync}=require('node:fs')
const redis=new URL(process.env.REDIS_URL||'redis://crm-redis:6379')
const db=createClient(process.env.SUPABASE_INTERNAL_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(10000)})}})
async function usuarioAtivo(id){
 if(!/^[0-9a-f-]{36}$/i.test(id))return false
 const {data,error}=await db.from('usuarios').select('id').or(`auth_id.eq.${id},id.eq.${id}`).eq('ativo',true).eq('is_admin',true).limit(1)
 if(error)throw Error('Falha ao verificar operador')
 return !!data?.length
}
async function consulta(url,key){
 const r=await fetch(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000),redirect:'error'})
 if(r.status===404)return null
 if(!r.ok)throw Error('Provedor temporariamente indisponível')
 return r.json()
}
const worker=new Worker('clube-sync-contatos',async job=>{
 if(!Array.isArray(job.data.ids)||job.data.ids.length>100)throw new UnrecoverableError('Tarefa inválida')
 const {data:config,error}=await db.from('config_wasender').select('api_key').single()
 if(error||!config?.api_key)throw Error('Configuração do provedor indisponível')
 const inicio=typeof job.progress==='object'?job.progress?.processados||0:0
 let atualizados=typeof job.progress==='object'?job.progress?.atualizados||0:0
 for(let i=inicio;i<job.data.ids.length;i++){
  if(!await usuarioAtivo(job.data.owner))throw new UnrecoverableError('Operador sem permissão')
  const {data:c,error}=await db.from('conversas_whatsapp').select('id,telefone,nome_contato,foto_perfil_url').eq('id',job.data.ids[i]).maybeSingle()
  if(error)throw Error('Falha na consulta do contato')
  if(c){
   let numero=(c.telefone||'').replace(/\D/g,'').slice(0,15)
   if(numero.length>=10){
    if(!numero.startsWith('55'))numero='55'+numero
    const base=`https://www.wasenderapi.com/api/contacts/${numero}`
    let alterado=false
    if(!c.nome_contato||c.nome_contato==='Desconhecido'){
     const info=await consulta(base,config.api_key)
     const nome=info?.success&&(info.data?.pushName||info.data?.name||info.data?.notify||info.data?.verifiedName)
     if(typeof nome==='string'&&nome.trim()){
      const {error}=await db.from('conversas_whatsapp').update({nome_contato:nome.slice(0,200)}).eq('id',c.id).or('nome_contato.is.null,nome_contato.eq.Desconhecido')
      if(error)throw Error('Falha ao atualizar nome');alterado=true
     }
    }
    if(!c.foto_perfil_url){
     const foto=await consulta(base+'/picture',config.api_key)
     const url=foto?.success&&foto.data?.imgUrl
     if(typeof url==='string'&&url.startsWith('https://')){
      const {error}=await db.from('conversas_whatsapp').update({foto_perfil_url:url}).eq('id',c.id).is('foto_perfil_url',null)
      if(error)throw Error('Falha ao atualizar foto');alterado=true
     }
    }
    if(alterado)atualizados++
   }
  }
  await job.updateProgress({processados:i+1,total:job.data.ids.length,atualizados})
  await new Promise(resolve=>setTimeout(resolve,500))
 }
 return {processados:job.data.ids.length,atualizados}
},{connection:{host:redis.hostname,port:Number(redis.port||6379),username:redis.username||undefined,password:redis.password?decodeURIComponent(redis.password):undefined,maxRetriesPerRequest:null,...(redis.protocol==='rediss:'?{tls:{}}:{})},concurrency:1})
worker.on('error',()=>console.error('Worker de contatos: conexão indisponível'))
worker.on('failed',job=>console.error('Tarefa de contatos falhou:',job?.id))
const pararPush=require('./notificacoes.cjs')(db)
const pulso=setInterval(()=>writeFileSync('/tmp/contatos-alive',String(Date.now())),10000)
writeFileSync('/tmp/contatos-alive',String(Date.now()))
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{clearInterval(pulso);await Promise.all([worker.close(),pararPush()]);process.exit(0)})
