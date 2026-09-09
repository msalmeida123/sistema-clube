const fs=require('fs'),crypto=require('crypto');
const path=require('path');
const root=__dirname;
const vars=Object.fromEntries(fs.readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const base='http://127.0.0.1:8000';
const headers={apikey:vars.SERVICE_ROLE_KEY,Authorization:'Bearer '+vars.SERVICE_ROLE_KEY,'Content-Type':'application/json'};
async function req(url,options={}){const r=await fetch(base+url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status+' em '+url+': '+(await r.text()).slice(0,250));return r.status===204?null:await r.json();}
(async()=>{
const email='admin@clube.local';
const lista=await req('/auth/v1/admin/users?page=1&per_page=100');
if(lista.users.some(x=>x.email===email)){console.log('Administrador local já existe; senha preservada.');return;}
const password=crypto.randomBytes(12).toString('base64url')+'!aA1';
// Salva a credencial antes da criação para não perder acesso se uma etapa posterior falhar.
fs.appendFileSync(path.join(root,'ACESSO-LOCAL.txt'),'\nSistema: http://localhost:3000\nE-mail: '+email+'\nSenha: '+password+'\n');
const usuario=await req('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password,email_confirm:true,user_metadata:{nome:'Administrador Local'}})});
await req('/rest/v1/usuarios',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({id:usuario.id,auth_id:usuario.id,nome:'Administrador Local',email,setor:'admin',ativo:true,is_admin:true,permissoes:['dashboard','associados','dependentes','financeiro','compras','portaria','exames','infracoes','eleicoes','relatorios','crm','configuracoes','usuarios','bar']})});
const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:vars.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
if(!r.ok)throw new Error('Falha ao testar login local');
const session=await r.json();
const perfil=await fetch(base+'/rest/v1/usuarios?select=email,is_admin,ativo&auth_id=eq.'+session.user.id,{headers:{apikey:vars.ANON_KEY,Authorization:'Bearer '+session.access_token}});
if(!perfil.ok)throw new Error('Falha ao testar RLS do usuário local');
console.log('Administrador criado. Login e leitura do perfil por JWT validados. Credenciais em ACESSO-LOCAL.txt.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
