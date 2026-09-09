import { SupabaseClient } from '@supabase/supabase-js'
import { gzipSync } from 'node:zlib'
import { createHash, randomUUID } from 'node:crypto'

export async function arquivarLote(db: SupabaseClient) {
 const {data,error}=await db.rpc('crm_lote_arquivo')
 if(error) throw error
 if(!data?.length) return 0
 const buffer=gzipSync(Buffer.from(JSON.stringify({version:1,created_at:new Date().toISOString(),registros:data})))
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex')
 const path=`${new Date().toISOString().slice(0,10)}/${randomUUID()}.json.gz`
 const bucket=db.storage.from('crm-arquivo')
 const upload=await bucket.upload(path,buffer,{contentType:'application/gzip',upsert:false})
 if(upload.error) throw upload.error
 const download=await bucket.download(path)
 if(download.error || !download.data) throw new Error('Arquivo não pôde ser verificado')
 if(hash(Buffer.from(await download.data.arrayBuffer()))!==hash(buffer)) throw new Error('Arquivo divergente; limpeza cancelada')
 const result=await db.rpc('crm_confirmar_arquivo',{p_lote:data})
 if(result.error) throw result.error
 console.log('CRM: lote arquivado',path,'mensagens removidas:',result.data)
 return data.length as number
}

export async function executarRetencao(db: SupabaseClient) {
 // Limita trabalho diário a 10 mil mensagens para não monopolizar o banco.
 for(let i=0;i<100;i++) if(await arquivarLote(db)===0) break
}
