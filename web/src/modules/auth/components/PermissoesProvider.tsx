// Provider de Permissões - Context React (UI/estado global)
'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
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
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setPermissoes({})
        setIsAdmin(false)
        return
      }

      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id, is_admin, perfil_acesso_id')
        .eq('auth_id', user.id)
        .single()

      if (!userData) {
        setPermissoes({})
        setIsAdmin(false)
        return
      }

      setUsuarioId(userData.id)
      setPerfilId(userData.perfil_acesso_id)
      setIsAdmin(userData.is_admin || false)

      // Admin tem todas as permissões
      if (userData.is_admin) {
        const todasPaginas = await permissoesRepository.findPaginas()
        setPaginas(todasPaginas)

        const paginasMapTemp: Record<string, PaginaSistema> = {}
        const permissoesAdmin: Record<string, PermissaoCRUD> = {}

        todasPaginas.forEach(p => {
          paginasMapTemp[p.codigo] = p
          permissoesAdmin[p.id] = {
            pagina_id: p.id,
            pode_visualizar: true,
            pode_criar: true,
            pode_editar: true,
            pode_excluir: true
          }
        })

        setPaginasMap(paginasMapTemp)
        setPermissoes(permissoesAdmin)
        return
      }

      // Carregar páginas e permissões
      const [todasPaginas, permissoesUsuario] = await Promise.all([
        permissoesRepository.findPaginas(),
        permissoesRepository.findPermissoesCompletas(userData.id, userData.perfil_acesso_id)
      ])

      setPaginas(todasPaginas)

      const paginasMapTemp: Record<string, PaginaSistema> = {}
      todasPaginas.forEach(p => {
        paginasMapTemp[p.codigo] = p
      })
      setPaginasMap(paginasMapTemp)

      setPermissoes(permissoesUsuario)

    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarPermissoes()
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
