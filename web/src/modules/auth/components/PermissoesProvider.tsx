// Provider de Permissões - Context React (UI/estado global)
'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { PermissaoCRUD, PaginaSistema, TipoAcao } from '../types'
import * as permissoesRepository from '../repositories/permissoes.repository'

export interface PermissoesContextType {
  permissoes: Record<string, PermissaoCRUD>
  paginas: PaginaSistema[]
  loading: boolean
  isAdmin: boolean
  podeVisualizar: (codigoPagina: string) => boolean
  podeCriar: (codigoPagina: string) => boolean
  podeEditar: (codigoPagina: string) => boolean
  podeExcluir: (codigoPagina: string) => boolean
  podeAcao: (codigoPagina: string, acao: TipoAcao) => boolean
  recarregar: () => Promise<void>
}

export const PermissoesContext = createContext<PermissoesContextType | null>(null)

export function PermissoesProvider({ children }: { children: React.ReactNode }) {
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoCRUD>>({})
  const [paginasMap, setPaginasMap] = useState<Record<string, PaginaSistema>>({})
  const [paginas, setPaginas] = useState<PaginaSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [perfilId, setPerfilId] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const carregarPermissoes = useCallback(async () => {
    // O carregamento inicial já começa ativo. Atualizações periódicas não devem desmontar formulários.
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setPermissoes({})
        setIsAdmin(false)
        return
      }

      const { data: rows, error } = await supabase.rpc('minhas_permissoes')
      if (error) throw error
      const todasPaginas = await permissoesRepository.findPaginas()
      const map: Record<string, PaginaSistema> = {}
      const permissions: Record<string, PermissaoCRUD> = {}
      todasPaginas.forEach(p => { map[p.codigo] = p })
      ;(rows || []).forEach((r: any) => { permissions[r.id] = { ...r, pagina_id: r.id } })
      setPaginas(todasPaginas); setPaginasMap(map); setPermissoes(permissions)
      // Todas as ações, inclusive do administrador, já foram resolvidas no servidor.
      const atual = await buscarUsuarioAtual<any>(supabase, user.id, 'ativo,is_admin')
      setIsAdmin(atual?.ativo === true && atual?.is_admin === true)

    } catch (error) {
      setPermissoes({}); setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void carregarPermissoes()
    const timer = setInterval(() => { void carregarPermissoes() }, 15000)
    const focus = () => { void carregarPermissoes() }
    window.addEventListener('focus', focus)
    return () => { clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [carregarPermissoes])

  // Funções de verificação
  const getPermissaoPorCodigo = useCallback((codigoPagina: string): PermissaoCRUD | null => {
    const pagina = paginasMap[codigoPagina]
    if (!pagina) return null
    return permissoes[pagina.id] || null
  }, [paginasMap, permissoes])

  const podeVisualizar = useCallback((codigoPagina: string): boolean => {
    if (isAdmin) return true
    const permissao = getPermissaoPorCodigo(codigoPagina)
    return permissao?.pode_visualizar || false
  }, [isAdmin, getPermissaoPorCodigo])

  const podeCriar = useCallback((codigoPagina: string): boolean => {
    if (isAdmin) return true
    const permissao = getPermissaoPorCodigo(codigoPagina)
    return permissao?.pode_criar || false
  }, [isAdmin, getPermissaoPorCodigo])

  const podeEditar = useCallback((codigoPagina: string): boolean => {
    if (isAdmin) return true
    const permissao = getPermissaoPorCodigo(codigoPagina)
    return permissao?.pode_editar || false
  }, [isAdmin, getPermissaoPorCodigo])

  const podeExcluir = useCallback((codigoPagina: string): boolean => {
    if (isAdmin) return true
    const permissao = getPermissaoPorCodigo(codigoPagina)
    return permissao?.pode_excluir || false
  }, [isAdmin, getPermissaoPorCodigo])

  const podeAcao = useCallback((codigoPagina: string, acao: TipoAcao): boolean => {
    if (isAdmin) return true
    const permissao = getPermissaoPorCodigo(codigoPagina)
    if (!permissao) return false

    switch (acao) {
      case 'visualizar': return permissao.pode_visualizar
      case 'criar': return permissao.pode_criar
      case 'editar': return permissao.pode_editar
      case 'excluir': return permissao.pode_excluir
      default: return false
    }
  }, [isAdmin, getPermissaoPorCodigo])

  return (
    <PermissoesContext.Provider value={{
      permissoes,
      paginas,
      loading,
      isAdmin,
      podeVisualizar,
      podeCriar,
      podeEditar,
      podeExcluir,
      podeAcao,
      recarregar: carregarPermissoes
    }}>
      {children}
    </PermissoesContext.Provider>
  )
}
