import {NextRequest,NextResponse} from 'next/server'
import {atorTema,lerTema,erroTema,ErroTema,origemTema} from '@/lib/tema/servidor'
import {coresSchema,avisos,MAX_ICONE} from '@/lib/tema/modelo'
import {prepararIcone} from '@/lib/tema/imagem'
import {appDb,limite} from '@/lib/associado-app'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(){try{const ator=await atorTema();return NextResponse.json(await lerTema(ator.clube),{headers:{'Cache-Control':'no-store'}})}catch(e){return erroTema(e)}}
export async function PUT(req:NextRequest){try{
 origemTema(req);const ator=await atorTema();const db=appDb();await limite(db,`tema:${ator.user.id}`,20)
 if(Number(req.headers.get('content-length')||0)>MAX_ICONE+32768)throw new ErroTema(413,'O ícone deve ter no máximo 2 MB.')
 // Leitura limitada também para uploads sem Content-Length.
 const reader=req.body?.getReader();if(!reader)throw new ErroTema(400,'Confira os campos e tente novamente.');let bytes=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_ICONE+32768){await reader.cancel();throw new ErroTema(413,'O ícone deve ter no máximo 2 MB.')}chunks.push(value)}
 const body=await new Response(Buffer.concat(chunks),{headers:{'content-type':req.headers.get('content-type')||''}}).formData()
 if(['cores','versao','acao'].some(k=>!body.has(k))||Array.from(body.keys()).some(k=>!['cores','versao','acao','icone'].includes(k))||Array.from(body.keys()).some(k=>body.getAll(k).length!==1))throw new ErroTema(400,'Solicitação inválida.')
 let raw:unknown;try{raw=JSON.parse(String(body.get('cores')))}catch{throw new ErroTema(422,'Informe todas as cores no formato #RRGGBB.')}
 const cores=coresSchema.safeParse(raw);if(!cores.success)throw new ErroTema(422,'Informe todas as cores no formato #RRGGBB.')
 if(avisos(cores.data).length)throw new ErroTema(422,'Ajuste as combinações indicadas para manter o contraste mínimo de leitura.')
 const versao=Number(body.get('versao')),acao=String(body.get('acao'));if(!Number.isSafeInteger(versao)||versao<0||!['manter','remover','substituir'].includes(acao))throw new ErroTema(422,'Confira os campos e tente novamente.')
 let icones=null;if(acao==='substituir'){const file=body.get('icone');if(!file||typeof file==='string')throw new ErroTema(422,'Selecione uma imagem.');try{icones=await prepararIcone(file)}catch{throw new ErroTema(422,'Use PNG, JPG ou WEBP de até 2 MB, entre 192 e 4096 pixels em cada dimensão, sem animação.')}}else if(body.has('icone'))throw new ErroTema(422,'Confira o ícone selecionado.')
 const {error}=await db.rpc('salvar_personalizacao',{p_ator:ator.user.id,p_cores:cores.data,p_icone_acao:acao,p_icones:icones,p_versao:versao});if(error){if(error.message.includes('CONFLITO'))throw new ErroTema(409,'Outro administrador alterou o tema. Cancele para carregar a versão atual antes de salvar.');throw error}
 return NextResponse.json(await lerTema(ator.clube),{headers:{'Cache-Control':'no-store'}})
 }catch(e){return erroTema(e)}}
