const cp=require('child_process'),fs=require('fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
function docker(args){const r=cp.spawnSync('docker',args,{encoding:'utf8'});if(r.status)throw Error('Docker: '+r.stderr);return r.stdout}
function bloqueado(r){assert.ok([401,307].includes(r.status));if(r.status===307)assert.ok(new URL(r.headers.get('location'),'http://localhost:3033').pathname==='/login')}
(async()=>{let running=false;try{
 docker(['run','--rm','-d','--name','clube-backup-api-teste','--network','clube-supabase-local','-p','127.0.0.1:3033:3000','-v','clube-sistema-backups:/backups:ro','-e','NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/supabase','-e','NEXT_PUBLIC_SUPABASE_ANON_KEY='+env.ANON_KEY,'-e','SUPABASE_SERVICE_ROLE_KEY='+env.SERVICE_ROLE_KEY,'-e','NEXT_PUBLIC_SUPABASE_LOCAL_PROXY=1','sistema-clube:local-backup-logs-20260908']);running=true;
 const base='http://localhost:3033';for(let i=0;i<40;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,1000))}
 bloqueado(await fetch(base+'/api/sistema/backups',{redirect:'manual'}));
 const pass=fs.readFileSync('deploy/supabase-local/ACESSO-LOCAL.txt','utf8').match(/^Senha:\s*(.+)$/m)[1].trim();
 const login=await fetch(base+'/supabase/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@clube.local',password:pass})});assert.ok(login.ok);const s=await login.json();
 const cookie='sb-localhost-auth-token='+encodeURIComponent(JSON.stringify([s.access_token,s.refresh_token,null,null,null]));
 const list=await fetch(base+'/api/sistema/backups',{headers:{cookie}});assert.equal(list.status,200);const body=await list.json();const backup=body.backups.find(x=>x.status==='concluido');assert.ok(backup);
 bloqueado(await fetch(base+'/api/sistema/backups/'+backup.id,{redirect:'manual'}));
 const file=await fetch(base+'/api/sistema/backups/'+backup.id,{headers:{cookie}});assert.equal(file.status,200);const bytes=Buffer.from(await file.arrayBuffer());assert.equal(bytes.length,Number(backup.tamanho));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),backup.sha256);
 const page=await fetch(base+'/dashboard/configuracoes',{headers:{cookie},redirect:'manual'});assert.equal(page.status,200);
 console.log('PASS: acesso anônimo bloqueado, administrador lista e baixa backup, hash e tamanho conferem, Configurações responde.');
 }finally{if(running)docker(['stop','clube-backup-api-teste'])}
})().catch(e=>{console.error(e.message);process.exitCode=1});

