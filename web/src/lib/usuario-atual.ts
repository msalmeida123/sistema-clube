import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Busca a linha de `usuarios` correspondente ao usuário autenticado.
 *
 * `usuarios.id` é a PK da tabela (usada em update/delete de um registro) e
 * `usuarios.auth_id` é o vínculo com `auth.users` — ver `AuthRepository` e
 * `POST /api/usuarios`, que insere apenas `auth_id`. Filtrar por `id` usando o
 * uid do auth só funciona para registros antigos, gravados quando as duas
 * colunas coincidiam; usuários criados pela tela de Usuários não são
 * encontrados e ficam sem permissão nenhuma.
 *
 * Enquanto a base tiver os dois formatos, a busca tenta `auth_id` e só depois
 * cai para `id`. Quando todos os registros tiverem `auth_id` preenchido, o
 * segundo passo pode ser removido.
 */
export async function buscarUsuarioAtual<T = any>(
  supabase: SupabaseClient,
  authUserId: string,
  colunas = '*'
): Promise<T | null> {
  const porAuthId = await supabase
    .from('usuarios')
    .select(colunas)
    .eq('auth_id', authUserId)
    .limit(1)
    .maybeSingle()

  if (porAuthId.data) return porAuthId.data as T

  // Fallback para registros anteriores ao uso de auth_id.
  const porId = await supabase
    .from('usuarios')
    .select(colunas)
    .eq('id', authUserId)
    .limit(1)
    .maybeSingle()

  return (porId.data as T) ?? null
}

/**
 * Verifica se o usuário autenticado tem um código de permissão.
 *
 * Admin passa em qualquer código. Devolve `isAdmin` separado para as rotas que
 * exigem admin mesmo de quem tem a permissão do módulo (ex.: cancelamento de
 * NFC-e, que é irreversível e tem prazo fiscal).
 */
export async function verificarPermissao(
  supabase: SupabaseClient,
  authUserId: string,
  codigo: string
): Promise<{ autorizado: boolean; isAdmin: boolean }> {
  const usuario = await buscarUsuarioAtual<{
    is_admin: boolean | null
    permissoes: string[] | null
    ativo: boolean | null
  }>(supabase, authUserId, 'is_admin, permissoes, ativo')

  if (usuario?.ativo !== true) return { autorizado: false, isAdmin: false }

  const isAdmin = Boolean(usuario?.is_admin)

  return {
    autorizado: isAdmin || Boolean(usuario?.permissoes?.includes(codigo)),
    isAdmin
  }
}
