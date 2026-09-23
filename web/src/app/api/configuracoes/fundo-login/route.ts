import {NextRequest,NextResponse} from 'next/server'
import {randomUUID} from 'node:crypto'
import {atorTema,origemTema,erroTema,ErroTema} from '@/lib/tema/servidor'
import {appDb,limite} from '@/lib/associado-app'
import {MAX_FUNDO,prepararFundo} from '@/lib/tema/fundo'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const json=(data:unknown)=>NextResponse.json(data,{headers:{'Cache-Control':'no-store'}})
export async function GET(){try{
 const ator=await atorTema()
 const {data,error}=await appDb().from('clube_fundo_login').select('versao').eq('clube_id',ator.clube).maybeSingle()
 if(error)throw error
 return json({versao:data?.versao ?? null})
}catch(e){return erroTema(e)}}
export async function PUT(req:NextRequest){try{
 origemTema(req);const ator=await atorTema();const db=appDb();await limite(db,`fundo-login:${ator.user.id}`,20)
 // Limite efetivo também para uploads sem Content-Length.
 const reader=req.body?.getReader();if(!reader)throw new ErroTema(422,'Selecione uma imagem.')
 const chunks:Uint8Array[]=[];let total=0
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX_FUNDO+32768){await reader.cancel();throw new ErroTema(413,'A imagem deve ter até 8 MB.')}chunks.push(value)}
 const body=await new Response(Buffer.concat(chunks),{headers:{'content-type':req.headers.get('content-type')||''}}).formData()
 const file=body.get('imagem')
 if(!file||typeof file==='string'||body.getAll('imagem').length!==1||Array.from(body.keys()).some(k=>k!=='imagem'))throw new ErroTema(422,'Selecione uma imagem.')
 let dados:string
 try{dados=await prepararFundo(file)}catch{throw new ErroTema(422,'Use JPG, PNG ou WEBP sem animação, até 8 MB, com pelo menos 320 pixels em cada dimensão e até 32 megapixels.')}
 const versao=randomUUID()
 const {error}=await db.from('clube_fundo_login').upsert({clube_id:ator.clube,dados,versao,atualizado_por:ator.user.id,atualizado_em:new Date().toISOString()})
 if(error)throw error
 return json({versao})
}catch(e){return erroTema(e)}}
export async function DELETE(req:NextRequest){try{
 origemTema(req);const ator=await atorTema()
 const {error}=await appDb().from('clube_fundo_login').delete().eq('clube_id',ator.clube)
 if(error)throw error
 return json({versao:null})
}catch(e){return erroTema(e)}}
