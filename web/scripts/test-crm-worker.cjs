const cp=require('child_process'),fs=require('fs'),assert=require('node:assert/strict');
function docker(args,input){const r=cp.spawnSync('docker',args,{input,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout}
function sql(q){return docker(['exec','-i','clube-supabase-db','psql','-v','ON_ERROR_STOP=1','-At','-U','postgres','-d','postgres'],q)}
const base='f2000000-0000-4000-8000-00000000000';
(async()=>{
 assert.equal(sql("select count(*) from crm_fila where status in ('pendente','enviando');").trim(),'0','Não executar com envios reais pendentes');
 docker(['network','connect','clube-supabase-local','clube-redis-teste']);
 const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
 sql(`BEGIN;
 INSERT INTO whatsapp_providers(id,nome,tipo,ativo) VALUES('${base}1','TESTE WORKER INATIVO','wasender',false);
 INSERT INTO conversas_whatsapp(id,telefone,provider_id) VALUES('${base}2','TESTE SEM TELEFONE','${base}1');
 SELECT set_config('request.jwt.claim.role','service_role',true);
 SELECT crm_enfileirar_automatico('${base}3','${base}2','{"text":"TESTE SEM ENVIO","messageType":"text"}');
 SELECT crm_enfileirar_automatico('${base}4','${base}2','{"text":"TESTE INTERRUPCAO","messageType":"text"}');
 UPDATE crm_fila SET status='enviando',updated_at=now()-interval '5 minutes' WHERE id='${base}4';
 COMMIT;`);
 let running=false;
 try {
 docker(['run','-d','--rm','--name','clube-worker-teste','--network','clube-supabase-local','-e','NEXT_PUBLIC_SUPABASE_URL=http://api-gw:8000','-e','SUPABASE_SERVICE_ROLE_KEY='+env.SERVICE_ROLE_KEY,'-e','REDIS_URL=redis://clube-redis-teste:6379','sistema-clube:worker-crm-20260907']);running=true;
 for(let i=0;i<20;i++) {
  await new Promise(r=>setTimeout(r,2000));
  const rows=sql(`select id,status from crm_fila where id in ('${base}3','${base}4') order by id;`);
  if(rows.includes(base+'3|falhou')&&rows.includes(base+'4|incerto')) {
   assert.equal(sql(`select count(*) from mensagens_whatsapp where (id='${base}3' and status='falhou') or (id='${base}4' and status='incerto');`).trim(),'2');
   console.log('PASS: worker recupera pendência do banco, bloqueia provedor inativo e marca tarefa interrompida como incerta');return;
  }
 }
 throw Error('Worker não finalizou os estados esperados');
 } finally {
  if(running) docker(['stop','clube-worker-teste']);
  sql(`BEGIN; DELETE FROM crm_fila WHERE id IN ('${base}3','${base}4'); DELETE FROM mensagens_whatsapp WHERE id IN ('${base}3','${base}4'); DELETE FROM conversas_whatsapp WHERE id='${base}2'; DELETE FROM whatsapp_providers WHERE id='${base}1'; COMMIT;`);
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
