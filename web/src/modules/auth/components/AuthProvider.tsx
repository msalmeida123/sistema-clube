// Provider de autenticação - Context React (UI/estado global)
'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createClientComponentClient()
  const repository = createAuthRepository(supabase)
  const service = createAuthService(repository)

  // Carregar usuário ao iniciar
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const usuario = await service.getUsuarioAtual()
        setState({
          user: usuario,
          loading: false,
          error: null,
          isAuthenticated: !!usuario,
          isAdmin: usuario?.is_admin || false
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar usuário'
        }))
      }
    }

    carregarUsuario()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const usuario = await service.getUsuarioAtual()
        setState({
          user: usuario,
          loading: false,
          error: null,
          isAuthenticated: !!usuario,
          isAdmin: usuario?.is_admin || false
        })
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

    return () => subscription.unsubscribe()
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
