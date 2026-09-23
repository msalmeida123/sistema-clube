import {NextRequest,NextResponse} from 'next/server'
import {clubeTema,lerTema,erroTema} from '@/lib/tema/servidor'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){try{const tema=await lerTema(await clubeTema(req));return NextResponse.json({name:'Clube — Área do associado',short_name:'Clube',start_url:'/associado',scope:'/',display:'standalone',background_color:tema.cores.fundo,theme_color:tema.cores.cabecalho,icons:[192,512].map(size=>({src:`/api/tema/icone?size=${size}&v=${tema.versao}`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))},{headers:{'Content-Type':'application/manifest+json','Cache-Control':'private, no-cache','Vary':'Cookie, Host'}})}catch(e){return erroTema(e)}}
