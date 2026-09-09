const fs=require('node:fs'),fsp=fs.promises,path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root='/backups';
function run(cmd,args){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{env:process.env,stdio:['ignore','pipe','pipe'],timeout:7200000});let out='';p.stdout.on('data',b=>{out+=b;if(out.length>2000000)p.kill()});p.stderr.resume();p.on('error',()=>reject(Error('Falha ao executar '+cmd)));p.on('exit',code=>code===0?resolve(out):reject(Error('Falha ao executar '+cmd+' (código '+code+')')));});}
const sql=q=>run('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-c',q]);
async function checksum(file){const hash=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))hash.update(b);return hash.digest('hex');}
async function backup(id){
 if(!/^[0-9a-f-]{36}$/.test(id))throw Error('ID inválido');
 const dir=path.join(root,id+'.work'),archive=path.join(root,id+'.tar.gz'),partial=archive+'.partial';
 let heartbeat=setInterval(()=>sql(`UPDATE sistema_backups SET heartbeat=now() WHERE id='${id}' AND status='executando'`).catch(()=>{}),30000);
 try{
  await fsp.mkdir(dir,{recursive:true,mode:0o700});
  await run('pg_dump',['--format=custom','--no-owner','--file',path.join(dir,'database.dump')]);
  await run('pg_restore',['--list',path.join(dir,'database.dump')]);
  await run('tar',['-cf',path.join(dir,'storage.tar'),'-C','/storage','.']);
  await fsp.writeFile(path.join(dir,'manifest.json'),JSON.stringify({version:1,id,created_at:new Date().toISOString(),database:'PostgreSQL 17 / Supabase',database_sha256:await checksum(path.join(dir,'database.dump')),storage_sha256:await checksum(path.join(dir,'storage.tar')),scope:'Banco completo e volume Storage. Não inclui imagem Docker, stack, .env externo ou arquivos locais fora do Storage.',consistency:'Banco usa snapshot transacional. Storage é copiado ao vivo; para consistência entre banco e arquivos, executar sem uploads/exclusões durante a cópia.'},null,2));
  await run('tar',['-czf',partial,'-C',dir,'database.dump','storage.tar','manifest.json']);
  await run('tar',['-tzf',partial]);
  const sha=await checksum(partial),stat=await fsp.stat(partial);
  await fsp.chmod(partial,0o644);await fsp.rename(partial,archive);
  await sql(`UPDATE sistema_backups SET status='concluido',finalizado_em=now(),tamanho=${stat.size},sha256='${sha}' WHERE id='${id}' AND status='executando'`);
  await sql(`INSERT INTO sistema_auditoria(usuario_nome,tipo,acao,tabela,registro) VALUES('Serviço de backup','backup','CONCLUIDO','sistema_backups','${id}')`);
 }catch(e){await sql(`UPDATE sistema_backups SET status='falhou',finalizado_em=now(),erro='Falha na cópia. Verifique espaço em disco e acesso ao banco/Storage.' WHERE id='${id}'`).catch(()=>{});console.error('Backup falhou:',id,e.message);await fsp.rm(partial,{force:true}).catch(()=>{});}
 finally{clearInterval(heartbeat);await fsp.rm(dir,{recursive:true,force:true});}
}
async function cycle(){
 await sql("UPDATE sistema_backups SET status='falhou',finalizado_em=now(),erro='Execução interrompida. Solicite um novo backup.' WHERE status='executando' AND heartbeat<now()-interval '5 minutes'");
 const id=(await sql("WITH job AS (SELECT id FROM sistema_backups WHERE status='pendente' ORDER BY criado_em FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE sistema_backups b SET status='executando',iniciado_em=now(),heartbeat=now() FROM job WHERE b.id=job.id RETURNING b.id")).trim();
 if(id)await backup(id);
}
(async()=>{await fsp.mkdir(root,{recursive:true});await fsp.writeFile(root+'/worker-heartbeat','online');setInterval(()=>fsp.writeFile(root+'/worker-heartbeat','online').catch(()=>{}),15000).unref();do{try{await cycle()}catch(e){console.error('Serviço de backup: banco indisponível ou migração pendente.')}if(process.env.BACKUP_ONCE==='1')break;await new Promise(r=>setTimeout(r,5000));}while(true)})().catch(()=>process.exit(1));
