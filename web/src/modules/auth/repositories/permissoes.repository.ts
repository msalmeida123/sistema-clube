// Repositório de Permissões CRUD
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { 
  PaginaSistema, 
  PermissaoUsuario, 
  PermissaoPerfil, 
  PerfilAcesso,
  PermissaoCRUD 
} from '../types'

const supabase = createClientComponentClient()

// ==========================================
// PÁGINAS DO SISTEMA
// ==========================================

export async function findPaginas(): Promise<PaginaSistema[]> {
  const { data, error } = await supabase
    .from('paginas_sistema')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  if (error) throw error
  return data || []
}

export async function findPaginaByCodigo(codigo: string): Promise<PaginaSistema | null> {
  const { data, error } = await supabase
    .from('paginas_sistema')
    .select('*')
    .eq('codigo', codigo)
    .eq('ativo', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ==========================================
// PERFIS DE ACESSO
// ==========================================

export async function findPerfis(): Promise<PerfilAcesso[]> {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  if (error) throw error
  return data || []
}

export async function findPerfilById(id: string): Promise<PerfilAcesso | null> {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createPerfil(perfil: Omit<PerfilAcesso, 'id' | 'created_at'>): Promise<PerfilAcesso> {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .insert(perfil)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePerfil(id: string, perfil: Partial<PerfilAcesso>): Promise<PerfilAcesso> {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .update(perfil)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePerfil(id: string): Promise<void> {
  const { error } = await supabase
    .from('perfis_acesso')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

// ==========================================
// PERMISSÕES DO USUÁRIO
// ==========================================

export async function findPermissoesUsuario(usuarioId: string): Promise<PermissaoUsuario[]> {
  const { data, error } = await supabase
    .from('permissoes_usuario')
    .select('*')
    .eq('usuario_id', usuarioId)

  if (error) throw error
  return data || []
}

export async function savePermissoesUsuario(
  usuarioId: string, 
  permissoes: PermissaoCRUD[]
): Promise<void> {
  // Deletar permissões antigas
  const { error: deleteError } = await supabase
    .from('permissoes_usuario')
    .delete()
    .eq('usuario_id', usuarioId)

  if (deleteError) throw deleteError

  // Inserir novas permissões
  const novasPermissoes = permissoes
    .filter(p => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_excluir)
    .map(p => ({
      usuario_id: usuarioId,
      pagina_id: p.pagina_id,
      pode_visualizar: p.pode_visualizar,
      pode_criar: p.pode_criar,
      pode_editar: p.pode_editar,
      pode_excluir: p.pode_excluir
    }))

  if (novasPermissoes.length > 0) {
    const { error: insertError } = await supabase
      .from('permissoes_usuario')
      .insert(novasPermissoes)

    if (insertError) throw insertError
  }
}

// ==========================================
// PERMISSÕES DO PERFIL
// ==========================================

export async function findPermissoesPerfil(perfilId: string): Promise<PermissaoPerfil[]> {
  const { data, error } = await supabase
    .from('permissoes_perfil')
    .select('*')
    .eq('perfil_id', perfilId)

  if (error) throw error
  return data || []
}

export async function savePermissoesPerfil(
  perfilId: string, 
  permissoes: PermissaoCRUD[]
): Promise<void> {
  // Deletar permissões antigas
  const { error: deleteError } = await supabase
    .from('permissoes_perfil')
    .delete()
    .eq('perfil_id', perfilId)

  if (deleteError) throw deleteError

  // Inserir novas permissões
  const novasPermissoes = permissoes
    .filter(p => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_excluir)
    .map(p => ({
      perfil_id: perfilId,
      pagina_id: p.pagina_id,
      pode_visualizar: p.pode_visualizar,
      pode_criar: p.pode_criar,
      pode_editar: p.pode_editar,
      pode_excluir: p.pode_excluir
    }))

  if (novasPermissoes.length > 0) {
    const { error: insertError } = await supabase
      .from('permissoes_perfil')
      .insert(novasPermissoes)

    if (insertError) throw insertError
  }
}

// ==========================================
// BUSCAR PERMISSÕES COMBINADAS (USUÁRIO + PERFIL)
// ==========================================

export async function findPermissoesCompletas(
  usuarioId: string, 
  perfilId?: string | null
): Promise<Record<string, PermissaoCRUD>> {
  const permissoesMap: Record<string, PermissaoCRUD> = {}

  // Primeiro, carregar permissões do perfil (se tiver)
  if (perfilId) {
    const permissoesPerfil = await findPermissoesPerfil(perfilId)
    permissoesPerfil.forEach(p => {
      permissoesMap[p.pagina_id] = {
        pagina_id: p.pagina_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir
      }
    })
  }

  // Depois, sobrescrever com permissões específicas do usuário
  const permissoesUsuario = await findPermissoesUsuario(usuarioId)
  permissoesUsuario.forEach(p => {
    permissoesMap[p.pagina_id] = {
      pagina_id: p.pagina_id,
      pode_visualizar: p.pode_visualizar,
      pode_criar: p.pode_criar,
      pode_editar: p.pode_editar,
      pode_excluir: p.pode_excluir
    }
  })

  return permissoesMap
}

// ==========================================
// VERIFICAR PERMISSÃO ESPECÍFICA
// ==========================================

export async function verificarPermissao(
  usuarioId: string,
  perfilId: string | null | undefined,
  paginaCodigo: string,
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir'
): Promise<boolean> {
  // Buscar página pelo código
  const pagina = await findPaginaByCodigo(paginaCodigo)
  if (!pagina) return false

  // Buscar permissões combinadas
  const permissoes = await findPermissoesCompletas(usuarioId, perfilId)
  const permissao = permissoes[pagina.id]

  if (!permissao) return false

  switch (acao) {
    case 'visualizar': return permissao.pode_visualizar
    case 'criar': return permissao.pode_criar
    case 'editar': return permissao.pode_editar
    case 'excluir': return permissao.pode_excluir
    default: return false
  }
}
