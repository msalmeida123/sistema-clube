import {NextRequest} from 'next/server'
import {endpointMensagens} from '@/lib/mensagens-clube'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){return endpointMensagens(req,'associado')}
export async function POST(req:NextRequest){return endpointMensagens(req,'associado')}
export async function PATCH(req:NextRequest){return endpointMensagens(req,'associado')}
