const cp=require('child_process'),fs=require('fs'),assert=require('node:assert/strict');
function docker(args,input){const r=cp.spawnSync('docker',args,{input,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout}
function sql(q){return docker(['exec','-i','clube-supabase-db','psql','-v','ON_ERROR_STOP=1','-At','-U','postgres','-d','postgres'],q)}
(async()=>{
 const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
 const base='f4000000-0000-4000-8000-00000000000';
 let running=false;
 try {
 docker(['run','-d','--rm','--name','clube-web-fila-teste','--network','clube-supabase-local','-p','127.0.0.1:3031:3000','-e','NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/supabase','-e','NEXT_PUBLIC_SUPABASE_ANON_KEY='+env.ANON_KEY,'-e','SUPABASE_SERVICE_ROLE_KEY='+env.SERVICE_ROLE_KEY,'-e','NEXT_PUBLIC_SUPABASE_LOCAL_PROXY=1','-e','REDIS_URL=redis://127.0.0.1:1','sistema-clube:local-fila-crm-20260907']);running=true;
 for(let i=0;i<20;i++){try{if((await fetch('http://localhost:3031/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,1000))}
 const body={requestId:base+'2',conversaId:base+'1',text:'TESTE DURAVEL SEM REDIS'};
 const send=cookie=>fetch('http://localhost:3031/api/whatsapp/send',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const anonymous=await send();assert.ok([401,307].includes(anonymous.status));if(anonymous.status===307)assert.ok(anonymous.headers.get('location').includes('/login')); 
 const pass=fs.readFileSync('deploy/supabase-local/ACESSO-LOCAL.txt','utf8').match(/^Senha:\s*(.+)$/m)[1].trim();
 const auth=await fetch('http://localhost:3000/supabase/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@clube.local',password:pass})});assert.ok(auth.ok);const session=await auth.json();
 const cookie='sb-localhost-auth-token='+encodeURIComponent(JSON.stringify([session.access_token,session.refresh_token,null,null,null]));
 sql(`INSERT INTO conversas_whatsapp(id,telefone) VALUES('${base}1','TESTE SEM TELEFONE');`);
 const responses=await Promise.all([send(cookie),send(cookie)]);for(const r of responses)assert.equal(r.status,202);
 assert.equal(sql(`SELECT count(*) FROM crm_fila WHERE id='${base}2' AND status='pendente';`).trim(),'1');
 assert.equal(sql(`SELECT count(*) FROM mensagens_whatsapp WHERE id='${base}2' AND status='na_fila';`).trim(),'1');
 console.log('PASS: imagem web autentica, rejeita anônimo e mantém uma única mensagem na fila com Redis desligado');
 } finally {
 if(running) docker(['stop','clube-web-fila-teste']);
 sql(`BEGIN; DELETE FROM crm_fila WHERE id='${base}2'; DELETE FROM mensagens_whatsapp WHERE id='${base}2'; DELETE FROM conversas_whatsapp WHERE id='${base}1'; COMMIT;`);
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
