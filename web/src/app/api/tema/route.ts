import {NextRequest,NextResponse} from 'next/server'
import {clubeTema,lerTema,erroTema} from '@/lib/tema/servidor'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){try{return NextResponse.json(await lerTema(await clubeTema(req)),{headers:{'Cache-Control':'private, no-cache','Vary':'Cookie, Host'}})}catch(e){return erroTema(e)}}
