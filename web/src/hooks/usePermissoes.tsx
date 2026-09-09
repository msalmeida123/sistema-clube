'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'

type PermissoesContextType = {
  permissoes: string[]
  isAdmin: boolean
  loading: boolean
  temPermissao: (codigo: string) => boolean
  recarregar: () => Promise<void>
}

const PermissoesContext = createContext<PermissoesContextType | null>(null)

// Mapeamento de rotas para códigos de permissão
const ROTAS_PERMISSOES: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/associados': 'associados',
  '/dashboard/dependentes': 'dependentes',
  '/dashboard/financeiro': 'financeiro',
  '/dashboard/compras': 'compras',
  '/dashboard/portaria': 'portaria',
  '/dashboard/piscina-portaria': 'portaria',
  '/dashboard/academia-portaria': 'portaria',
  '/dashboard/academia': 'academia',
  '/dashboard/exames-medicos': 'exames',
  '/dashboard/infracoes': 'infracoes',
  '/dashboard/eleicoes': 'eleicoes',
  '/dashboard/relatorios': 'relatorios',
  '/dashboard/servicos': 'servicos',
  '/dashboard/crm': 'crm',
  '/dashboard/whatsapp': 'crm',
  '/dashboard/respostas-automaticas': 'crm',
  '/dashboard/bot-ia': 'crm',
  '/dashboard/configuracoes': 'configuracoes',
  '/dashboard/permissoes': 'usuarios',
  '/dashboard/planos': 'configuracoes',
  '/dashboard/convites': 'associados',
  '/dashboard/quiosques': 'configuracoes',
  '/dashboard/carnes': 'financeiro',
}

export function PermissoesProvider({ children }: { children: ReactNode }) {
  const [permissoes, setPermissoes] = useState<string[]>([])
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

      // Buscar dados do usuário incluindo permissões
      const userData = await buscarUsuarioAtual<{
        is_admin: boolean | null
        permissoes: string[] | null
      }>(supabase, user.id, 'is_admin, permissoes')

      if (userData?.is_admin) {
        setIsAdmin(true)
        // Admin tem acesso a tudo
        setPermissoes([
          'dashboard', 'associados', 'dependentes', 'financeiro', 'compras',
          'portaria', 'exames', 'infracoes', 'eleicoes', 'relatorios',
          'crm', 'servicos', 'configuracoes', 'usuarios', 'academia', 'bar'
        ])
      } else {
        setIsAdmin(false)
        setPermissoes(userData?.permissoes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPermissoes()

    // Escutar mudanças de autenticação
    let timer: ReturnType<typeof setTimeout> | undefined
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Consultas de auth devem ocorrer depois que o evento liberar o lock da sessão.
      clearTimeout(timer)
      timer = setTimeout(() => { void carregarPermissoes() }, 0)
    })

    return () => { clearTimeout(timer); subscription.unsubscribe() }
  }, [])

  const temPermissao = (codigo: string) => {
    if (isAdmin) return true
    return permissoes.includes(codigo)
  }

  return (
    <PermissoesContext.Provider value={{
      permissoes,
      isAdmin,
      loading,
      temPermissao,
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

// Hook auxiliar para verificar permissão de rota
export function usePermissaoRota(rota: string): boolean {
  const { isAdmin, permissoes } = usePermissoes()
  
  if (isAdmin) return true
  
  // Encontrar o código de permissão para a rota
  const rotaBase = Object.keys(ROTAS_PERMISSOES).find(r => rota.startsWith(r))
  if (!rotaBase) return true // Rota não mapeada, permitir
  
  const codigo = ROTAS_PERMISSOES[rotaBase]
  return permissoes.includes(codigo)
}
