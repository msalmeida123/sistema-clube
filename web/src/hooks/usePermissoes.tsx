'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Permissao = {
  codigo: string
  rota: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

type PermissoesContextType = {
  permissoes: Record<string, Permissao>
  isAdmin: boolean
  loading: boolean
  temPermissao: (codigo: string, acao?: 'visualizar' | 'criar' | 'editar' | 'excluir') => boolean
  temPermissaoRota: (rota: string) => boolean
  recarregar: () => Promise<void>
}

const PermissoesContext = createContext<PermissoesContextType | null>(null)

export function PermissoesProvider({ children }: { children: ReactNode }) {
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const carregarPermissoes = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Verificar se é admin
      const { data: userData } = await supabase
        .from('usuarios')
        .select('is_admin, perfil_acesso_id')
        .eq('id', user.id)
        .single()

      if (userData?.is_admin) {
        setIsAdmin(true)
        // Admin tem acesso a tudo
        const { data: paginas } = await supabase.from('paginas_sistema').select('codigo, rota')
        const todasPermissoes: Record<string, Permissao> = {}
        ;(paginas || []).forEach(p => {
          todasPermissoes[p.codigo] = {
            codigo: p.codigo,
            rota: p.rota,
            pode_visualizar: true,
            pode_criar: true,
            pode_editar: true,
            pode_excluir: true
          }
        })
        setPermissoes(todasPermissoes)
        setLoading(false)
        return
      }

      // Carregar páginas
      const { data: paginas } = await supabase
        .from('paginas_sistema')
        .select('id, codigo, rota')

      const paginasMap: Record<string, { codigo: string; rota: string }> = {}
      ;(paginas || []).forEach(p => {
        paginasMap[p.id] = { codigo: p.codigo, rota: p.rota }
      })

      // Carregar permissões do perfil
      const permissoesMap: Record<string, Permissao> = {}

      if (userData?.perfil_acesso_id) {
        const { data: permissoesPerfil } = await supabase
          .from('permissoes_perfil')
          .select('pagina_id, pode_visualizar, pode_criar, pode_editar, pode_excluir')
          .eq('perfil_id', userData.perfil_acesso_id)

        ;(permissoesPerfil || []).forEach(p => {
          const pagina = paginasMap[p.pagina_id]
          if (pagina) {
            permissoesMap[pagina.codigo] = {
              codigo: pagina.codigo,
              rota: pagina.rota,
              pode_visualizar: p.pode_visualizar,
              pode_criar: p.pode_criar,
              pode_editar: p.pode_editar,
              pode_excluir: p.pode_excluir
            }
          }
        })
      }

      // Carregar permissões individuais (sobrescrevem as do perfil)
      const { data: permissoesUsuario } = await supabase
        .from('permissoes_usuario')
        .select('pagina_id, pode_visualizar, pode_criar, pode_editar, pode_excluir')
        .eq('usuario_id', user.id)

      ;(permissoesUsuario || []).forEach(p => {
        const pagina = paginasMap[p.pagina_id]
        if (pagina) {
          permissoesMap[pagina.codigo] = {
            codigo: pagina.codigo,
            rota: pagina.rota,
            pode_visualizar: p.pode_visualizar,
            pode_criar: p.pode_criar,
            pode_editar: p.pode_editar,
            pode_excluir: p.pode_excluir
          }
        }
      })

      setPermissoes(permissoesMap)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPermissoes()
  }, [])

  const temPermissao = (codigo: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir' = 'visualizar') => {
    if (isAdmin) return true
    const perm = permissoes[codigo]
    if (!perm) return false
    
    switch (acao) {
      case 'visualizar': return perm.pode_visualizar
      case 'criar': return perm.pode_criar
      case 'editar': return perm.pode_editar
      case 'excluir': return perm.pode_excluir
      default: return false
    }
  }

  const temPermissaoRota = (rota: string) => {
    if (isAdmin) return true
    
    // Normalizar rota
    const rotaLimpa = rota.split('?')[0]
    
    // Verificar permissão exata
    const permissaoExata = Object.values(permissoes).find(p => {
      const rotaPerm = p.rota.split('?')[0]
      return rotaPerm === rotaLimpa && p.pode_visualizar
    })
    
    if (permissaoExata) return true

    // Verificar permissão pai (ex: /dashboard/financeiro permite /dashboard/financeiro?tab=xxx)
    const permissaoPai = Object.values(permissoes).find(p => {
      const rotaPerm = p.rota.split('?')[0]
      return rotaLimpa.startsWith(rotaPerm) && p.pode_visualizar
    })

    return !!permissaoPai
  }

  return (
    <PermissoesContext.Provider value={{
      permissoes,
      isAdmin,
      loading,
      temPermissao,
      temPermissaoRota,
      recarregar: carregarPermissoes
    }}>
      {children}
    </PermissoesContext.Provider>
  )
}

export function usePermissoes() {
  const context = useContext(PermissoesContext)
  if (!context) {
    throw new Error('usePermissoes deve ser usado dentro de PermissoesProvider')
  }
  return context
}
