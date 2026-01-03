// Hook de Permissões CRUD
'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { PermissaoCRUD, PaginaSistema, TipoAcao } from '../types'
import * as permissoesRepository from '../repositories/permissoes.repository'

// ==========================================
// CONTEXTO DE PERMISSÕES
// ==========================================

interface PermissoesContextType {
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

const PermissoesContext = createContext<PermissoesContextType | null>(null)

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

// ==========================================
// HOOK PRINCIPAL
// ==========================================

export function usePermissoesCRUD() {
  const context = useContext(PermissoesContext)
  if (!context) {
    throw new Error('usePermissoesCRUD deve ser usado dentro de PermissoesProvider')
  }
  return context
}

// ==========================================
// HOOK PARA PÁGINA ESPECÍFICA
// ==========================================

export function usePermissaoPagina(codigoPagina: string) {
  const { 
    loading, 
    isAdmin, 
    podeVisualizar, 
    podeCriar, 
    podeEditar, 
    podeExcluir 
  } = usePermissoesCRUD()

  return {
    loading,
    isAdmin,
    podeVisualizar: podeVisualizar(codigoPagina),
    podeCriar: podeCriar(codigoPagina),
    podeEditar: podeEditar(codigoPagina),
    podeExcluir: podeExcluir(codigoPagina),
  }
}

// ==========================================
// HOOK PARA GERENCIAMENTO DE PERMISSÕES
// ==========================================

export function useGerenciarPermissoes() {
  const [loading, setLoading] = useState(false)
  const [paginas, setPaginas] = useState<PaginaSistema[]>([])
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoCRUD>>({})

  const carregarPaginas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await permissoesRepository.findPaginas()
      
      // Organizar páginas pai e filhas
      const paginasPai = data.filter(p => !p.pagina_pai_id)
      const paginasOrganizadas = paginasPai.map(pai => ({
        ...pai,
        subpaginas: data.filter(p => p.pagina_pai_id === pai.id)
      }))
      
      setPaginas(paginasOrganizadas)
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarPermissoesUsuario = useCallback(async (usuarioId: string, perfilId?: string | null) => {
    setLoading(true)
    try {
      const data = await permissoesRepository.findPermissoesCompletas(usuarioId, perfilId)
      setPermissoes(data)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarPermissoesPerfil = useCallback(async (perfilId: string) => {
    setLoading(true)
    try {
      const data = await permissoesRepository.findPermissoesPerfil(perfilId)
      const permissoesMap: Record<string, PermissaoCRUD> = {}
      data.forEach(p => {
        permissoesMap[p.pagina_id] = {
          pagina_id: p.pagina_id,
          pode_visualizar: p.pode_visualizar,
          pode_criar: p.pode_criar,
          pode_editar: p.pode_editar,
          pode_excluir: p.pode_excluir
        }
      })
      setPermissoes(permissoesMap)
    } catch (error) {
      console.error('Erro ao carregar permissões do perfil:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const salvarPermissoesUsuario = useCallback(async (usuarioId: string) => {
    setLoading(true)
    try {
      await permissoesRepository.savePermissoesUsuario(usuarioId, Object.values(permissoes))
    } finally {
      setLoading(false)
    }
  }, [permissoes])

  const salvarPermissoesPerfil = useCallback(async (perfilId: string) => {
    setLoading(true)
    try {
      await permissoesRepository.savePermissoesPerfil(perfilId, Object.values(permissoes))
    } finally {
      setLoading(false)
    }
  }, [permissoes])

  const togglePermissao = useCallback((paginaId: string, tipo: keyof PermissaoCRUD) => {
    if (tipo === 'pagina_id') return

    setPermissoes(prev => {
      const atual = prev[paginaId] || {
        pagina_id: paginaId,
        pode_visualizar: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false
      }

      // Se desmarcar visualizar, desmarca tudo
      if (tipo === 'pode_visualizar' && atual.pode_visualizar) {
        return {
          ...prev,
          [paginaId]: {
            ...atual,
            pode_visualizar: false,
            pode_criar: false,
            pode_editar: false,
            pode_excluir: false
          }
        }
      }

      // Se marcar criar/editar/excluir, marca visualizar também
      if (tipo !== 'pode_visualizar' && !atual.pode_visualizar) {
        return {
          ...prev,
          [paginaId]: {
            ...atual,
            pode_visualizar: true,
            [tipo]: !atual[tipo]
          }
        }
      }

      return {
        ...prev,
        [paginaId]: {
          ...atual,
          [tipo]: !atual[tipo]
        }
      }
    })
  }, [])

  const marcarTodos = useCallback((paginaId: string, marcar: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [paginaId]: {
        pagina_id: paginaId,
        pode_visualizar: marcar,
        pode_criar: marcar,
        pode_editar: marcar,
        pode_excluir: marcar
      }
    }))
  }, [])

  return {
    loading,
    paginas,
    permissoes,
    setPermissoes,
    carregarPaginas,
    carregarPermissoesUsuario,
    carregarPermissoesPerfil,
    salvarPermissoesUsuario,
    salvarPermissoesPerfil,
    togglePermissao,
    marcarTodos
  }
}
