import { NextRequest, NextResponse } from 'next/server'
import { autorizarImpressao } from '@/lib/bar-impressao-auth'
import { validarImpressora } from '@/lib/impressora-rede'
export const runtime = 'nodejs'

export async function GET() {
  const auth = await autorizarImpressao(true)
  if (auth.status !== 200) return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: auth.status })
  const { data, error } = await auth.db!.from('bar_impressora').select('*').eq('id','cozinha').single()
  if (error) return NextResponse.json({ error: 'Não foi possível carregar a configuração. Verifique a migração da impressora.' }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const auth = await autorizarImpressao(true)
  if (auth.status !== 200) return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: auth.status })
  let config
  try { config = validarImpressora(await req.json()) } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }
  const { error } = await auth.db!.from('bar_impressora').upsert({ id:'cozinha', ...config, updated_at:new Date().toISOString() })
  if (error) return NextResponse.json({ error: 'Não foi possível salvar' }, { status: 500 })
  return NextResponse.json({ sucesso: true })
}
