// Provider de autenticação - Context React (UI/estado global)
'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createAuthRepository } from '../repositories/auth.repository'
import { createAuthService } from '../services/auth.service'
import type { LoginData, AuthState } from '../types'

export interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
  temPermissao: (permissao: string) => boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isAdmin: false
  })

  const router = useRouter()
  const [supabase] = useState(() => createClientComponentClient())
  const [repository] = useState(() => createAuthRepository(supabase))
  const [service] = useState(() => createAuthService(repository))

  // Carregar usuário ao iniciar
  useEffect(() => {
    let ativo = true
    const carregarUsuario = async () => {
      try {
        const usuario = await service.getUsuarioAtual()
        if (!ativo) return
        setState({
          user: usuario,
          loading: false,
          error: null,
          isAuthenticated: !!usuario,
          isAdmin: usuario?.is_admin || false
        })
      } catch (error) {
        if (!ativo) return
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar usuário'
        }))
      }
    }

    void carregarUsuario()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Consultas de sessão aguardam a liberação do lock do evento de auth.
        setTimeout(() => { void carregarUsuario() }, 0)
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          isAdmin: false
        })
      }
    })

    return () => { ativo = false; subscription.unsubscribe() }
  }, [])

  const login = useCallback(async (data: LoginData) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const usuario = await service.login(data)
      setState({
        user: usuario,
        loading: false,
        error: null,
        isAuthenticated: true,
        isAdmin: usuario.is_admin
      })
      router.push('/dashboard')
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login'
      }))
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await service.logout()
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isAdmin: false
      })
      router.push('/login')
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer logout'
      }))
    }
  }, [router])

  const temPermissao = useCallback((permissao: string) => {
    if (!state.user) return false
    return service.temPermissao(state.user, permissao)
  }, [state.user])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, temPermissao }}>
      {children}
    </AuthContext.Provider>
  )
}
