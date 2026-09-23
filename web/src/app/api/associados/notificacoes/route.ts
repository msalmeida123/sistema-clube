import {NextRequest} from 'next/server'
import {endpointNotificacoes} from '@/lib/push-clube'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){return endpointNotificacoes(req,'equipe')}
export async function POST(req:NextRequest){return endpointNotificacoes(req,'equipe')}
export async function DELETE(req:NextRequest){return endpointNotificacoes(req,'equipe')}
