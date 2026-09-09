import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verificarPermissao } from './usuario-atual'

export async function autorizarImpressao(admin = false) {
  const auth = createRouteHandlerClient({ cookies })
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { status: 401 as const }
  const permissao = await verificarPermissao(auth, user.id, 'bar')
  if (!permissao.autorizado || (admin && !permissao.isAdmin)) return { status: 403 as const }
  return { status: 200 as const, user, db: servicoAuditado(user.id) }
}
