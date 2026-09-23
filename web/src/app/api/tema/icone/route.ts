import {NextRequest} from 'next/server'
import sharp from 'sharp'
import {createHash} from 'node:crypto'
import {clubeTema,erroTema,ErroTema} from '@/lib/tema/servidor'
import {appDb} from '@/lib/associado-app'
import {tamanhos} from '@/lib/tema/modelo'
import {iconePadrao} from '@/lib/tema/imagem'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const defaults=new Map<number,Buffer>()
export async function GET(req:NextRequest){try{const size=Number(req.nextUrl.searchParams.get('size')||192);if(!(tamanhos as readonly number[]).includes(size))throw new ErroTema(400,'Tamanho indisponível.');const clube=await clubeTema(req);const {data,error}=await appDb().from('clube_personalizacao').select(`icones->s${size}`).eq('clube_id',clube).maybeSingle();if(error)throw error;const icone=req.nextUrl.searchParams.get('default')==='1'?null:(data as any)?.[`s${size}`];let buf:Buffer;if(icone)buf=Buffer.from(icone.dados,'base64');else{if(!defaults.has(size))defaults.set(size,await sharp(iconePadrao).resize(size,size).png().toBuffer());buf=defaults.get(size)!}const etag='"'+createHash('sha256').update(buf).digest('hex')+'"';const headers={'Content-Type':'image/png','Cache-Control':'private, no-cache','ETag':etag,'Vary':'Cookie, Host','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename="${icone?.nome||`clube-${size}.png`}"`};if(req.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});return new Response(new Uint8Array(buf),{headers})}catch(e){return erroTema(e)}}
