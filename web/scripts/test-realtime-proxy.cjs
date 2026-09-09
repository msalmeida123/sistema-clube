const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict');const {createClient}=require('@supabase/supabase-js');const WebSocket=require('ws');
const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
function sql(text){const r=cp.spawnSync('docker',['exec','-i','clube-supabase-db','psql','-v','ON_ERROR_STOP=1','-At','-U','postgres','-d','postgres'],{input:text,encoding:'utf8'});if(r.status)throw Error(r.stderr)}
(async()=>{
 assert.equal((await fetch('http://localhost:3032/api/health')).status,200);
 const pass=fs.readFileSync('deploy/supabase-local/ACESSO-LOCAL.txt','utf8').match(/^Senha:\s*(.+)$/m)[1].trim();
 const res=await fetch('http://localhost:3032/supabase/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@clube.local',password:pass})});assert.ok(res.ok);const session=await res.json();
 const client=createClient('http://localhost:3032/supabase',env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket}});
 await client.realtime.setAuth(session.access_token);
 const id='f6000000-0000-4000-8000-000000000001';let resolveEvent;const event=new Promise(r=>resolveEvent=r);
 const channel=client.channel('teste-proxy-'+Date.now()).on('postgres_changes',{event:'INSERT',schema:'public',table:'conversas_whatsapp',filter:'id=eq.'+id},p=>resolveEvent(p.new.id));
 try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Timeout na assinatura')),20000);channel.subscribe((s,error)=>{if(s==='SUBSCRIBED'){clearTimeout(timer);resolve()}else if(s==='CHANNEL_ERROR'){clearTimeout(timer);reject(Error('Falha ao assinar: '+(error?.message||s)))}})});
  sql(`INSERT INTO conversas_whatsapp(id,telefone,nome_contato) VALUES('${id}','TESTE SEM TELEFONE','TESTE REALTIME TEMPORARIO');`);
  let timer;const received=await Promise.race([event,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Evento não recebido')),10000)})]);clearTimeout(timer);assert.equal(received,id);console.log('PASS: HTTP, autenticação, WebSocket e evento de banco recebido pelo proxy');
 } finally {await client.removeAllChannels();sql(`DELETE FROM conversas_whatsapp WHERE id='${id}' AND nome_contato='TESTE REALTIME TEMPORARIO';`)}
})().catch(e=>{console.error(e.message);process.exitCode=1});
