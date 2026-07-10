// Hooks de Permissões CRUD (sem JSX — Provider vive em components/PermissoesProvider.tsx)
'use client'

import { useState, useCallback, useContext } from 'react'
import type { PermissaoCRUD, PaginaSistema } from '../types'
import * as permissoesRepository from '../repositories/permissoes.repository'
import { PermissoesContext } from '../components/PermissoesProvider'

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
