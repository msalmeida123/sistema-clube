import fs from 'node:fs'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {gunzipSync} from 'node:zlib'
import {createClient} from '@supabase/supabase-js'
import {arquivarLote} from '../workers/retencao'
const env=Object.fromEntries(fs.readFileSync('deploy/supabase-local/.env','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]))
async function main(){
 const db=createClient('http://localhost:8000',env.SERVICE_ROLE_KEY,{auth:{persistSession:false}}),id=randomUUID(),mid=randomUUID(),paths:string[]=[]
 const bucket=db.storage.from('crm-arquivo')
 try {
  const c=await db.from('conversas_whatsapp').insert({id,telefone:'TESTE ARQUIVO SEM ENVIO'});if(c.error)throw c.error
  const m=await db.from('mensagens_whatsapp').insert({id:mid,conversa_id:id,direcao:'entrada',conteudo:'TESTE ARQUIVO INTEGRAL',status:'recebida',created_at:new Date(Date.now()-100*86400000).toISOString()});if(m.error)throw m.error
  const wrapper={rpc:async(name:string,args?:any)=>{const r=await db.rpc(name,args);if(name==='crm_lote_arquivo'&&r.data)r.data=r.data.filter((x:any)=>x.mensagem.id===mid);return r},storage:{from:()=>({upload:async(path:string,b:Buffer,o:any)=>{paths.push(path);return bucket.upload(path,b,o)},download:(path:string)=>bucket.download(path)})}}
  assert.equal(await arquivarLote(wrapper as any),1)
  const remaining=await db.from('mensagens_whatsapp').select('id').eq('id',mid);if(remaining.error)throw remaining.error;assert.equal(remaining.data.length,0)
  const archive=await bucket.download(paths[0]);if(archive.error)throw archive.error
  const json=JSON.parse(gunzipSync(Buffer.from(await archive.data.arrayBuffer())).toString())
  assert.equal(json.registros[0].mensagem.conteudo,'TESTE ARQUIVO INTEGRAL')
  console.log('PASS: ciclo real arquiva, verifica, remove do banco e recupera conteúdo do gzip')
 } finally {
  await db.from('conversas_whatsapp').delete().eq('id',id)
  if(paths.length){const r=await bucket.remove(paths);if(r.error)throw r.error}
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1})
