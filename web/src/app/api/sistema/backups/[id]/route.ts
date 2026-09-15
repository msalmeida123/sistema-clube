import {NextResponse} from 'next/server'
import {adminSistema} from '@/lib/admin-sistema'
import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import {Readable} from 'node:stream'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(_req:Request,{params}: {params:Promise<{id:string}>}){
 const a=await adminSistema();if(!a.db)return NextResponse.json({error:'Acesso restrito'},{status:a.status})
 if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test((await params).id))return new Response(null,{status:400})
 const {data}=await a.db.from('sistema_backups').select('status,tamanho').eq('id',(await params).id).single()
 if(data?.status!=='concluido')return new Response(null,{status:404})
 const file='/backups/'+(await params).id+'.tar.gz'
 try{const s=await stat(file);if(s.size!==Number(data.tamanho))throw Error();const {error}=await a.db.rpc('sistema_registrar_download_backup',{p_id:(await params).id});if(error)return NextResponse.json({error:'Não foi possível registrar o download'},{status:500});return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream,{headers:{'Content-Type':'application/gzip','Content-Length':String(s.size),'Content-Disposition':`attachment; filename="backup-${(await params).id}.tar.gz"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch{return NextResponse.json({error:'Arquivo indisponível no volume de backup'},{status:404})}
}
