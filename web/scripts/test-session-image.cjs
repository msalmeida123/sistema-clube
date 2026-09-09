const cp=require('child_process'),fs=require('fs'),assert=require('node:assert/strict');
const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
function docker(args){const r=cp.spawnSync('docker',args,{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout}
(async()=>{let running=false;try{
docker(['run','--rm','-d','--name','clube-sessao-teste','--network','clube-supabase-local','-p','127.0.0.1:3033:3000','-e','NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/supabase','-e','NEXT_PUBLIC_SUPABASE_ANON_KEY='+env.ANON_KEY,'-e','SUPABASE_SERVICE_ROLE_KEY='+env.SERVICE_ROLE_KEY,'-e','NEXT_PUBLIC_SUPABASE_LOCAL_PROXY=1','sistema-clube:local-sessao-realtime-20260907']);running=true;
for(let i=0;i<30;i++){try{if((await fetch('http://localhost:3033/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,1000))}
assert.equal((await fetch('http://localhost:3033/api/health')).status,200);
const pass=fs.readFileSync('deploy/supabase-local/ACESSO-LOCAL.txt','utf8').match(/^Senha:\s*(.+)$/m)[1].trim();
const login=await fetch('http://localhost:3033/supabase/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@clube.local',password:pass})});assert.ok(login.ok);const s=await login.json();
const cookie='sb-localhost-auth-token='+encodeURIComponent(JSON.stringify([s.access_token,s.refresh_token,null,null,null]));
for(const path of ['/dashboard/configuracoes','/dashboard/whatsapp','/dashboard/crm']){const r=await fetch('http://localhost:3033'+path,{headers:{cookie},redirect:'manual'});assert.equal(r.status,200);assert.ok(!(await r.text()).includes('NEXT_REDIRECT'));}
console.log('PASS: nova imagem inicia, autentica e entrega configurações, WhatsApp e CRM');
}finally{if(running)docker(['stop','clube-sessao-teste'])}})().catch(e=>{console.error(e.message);process.exitCode=1});
