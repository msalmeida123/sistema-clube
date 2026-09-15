import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-client'
import { cookies } from 'next/headers'
import { verificarPermissao } from '@/lib/usuario-atual'
import { servicoAuditado } from '@/lib/supabase/servico-auditado'
import { protegerCertificado } from '@/lib/certificado-digital'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const campos = 'nome_arquivo,atualizado_em,atualizado_por'
function resposta(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } }) }
async function autorizar() {
  const auth = await createRouteHandlerClient({ cookies })
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { status: 401 }
  if (!(await verificarPermissao(auth, user.id, 'configuracoes')).isAdmin) return { status: 403 }
  return { status: 200, user, db: servicoAuditado(user.id) }
}
export async function GET() {
  const a = await autorizar(); if (!a.db) return resposta({ error: 'Acesso exclusivo do administrador.' }, a.status)
  const { data, error } = await a.db.from('sistema_certificado').select(campos).eq('id', true).maybeSingle()
  return error ? resposta({ error: 'Não foi possível consultar o certificado.' }, 500) : resposta({ certificado: data })
}
export async function POST(req: NextRequest) {
  const a = await autorizar(); if (!a.db) return resposta({ error: 'Acesso exclusivo do administrador.' }, a.status)
  if (Number(req.headers.get('content-length')) > 1100000) return resposta({ error: 'Arquivo muito grande. Limite: 1 MB.' }, 413)
  let form: FormData
  try { form = await req.formData() } catch { return resposta({ error: 'Envio inválido.' }, 400) }
  const arquivo = form.get('arquivo'), senha = form.get('senha')
  if (!arquivo || typeof arquivo === 'string' || !/\.(pfx|p12)$/i.test(arquivo.name) || arquivo.size > 1048576 || typeof senha !== 'string') return resposta({ error: 'Selecione um certificado A1 .pfx ou .p12 de até 1 MB.' }, 400)
  let protegido
  try { protegido = protegerCertificado(Buffer.from(await arquivo.arrayBuffer()), senha, process.env.CERTIFICADO_ENCRYPTION_KEY || '') }
  catch (e) { return resposta({ error: (e as Error).message }, 400) }
  const { error } = await a.db.from('sistema_certificado').upsert({ id: true, nome_arquivo: arquivo.name.slice(0, 200), protegido, atualizado_em: new Date().toISOString(), atualizado_por: a.user!.id })
  return error ? resposta({ error: 'Não foi possível salvar o certificado.' }, 500) : resposta({ ok: true })
}
export async function DELETE() {
  const a = await autorizar(); if (!a.db) return resposta({ error: 'Acesso exclusivo do administrador.' }, a.status)
  const { error } = await a.db.from('sistema_certificado').delete().eq('id', true)
  return error ? resposta({ error: 'Não foi possível remover o certificado.' }, 500) : resposta({ ok: true })
}
