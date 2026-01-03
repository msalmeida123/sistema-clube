// Hook Auth - Responsável APENAS por gerenciar estado React
'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createAuthRepository } from '../repositories/auth.repository'
import { createAuthService } from '../services/auth.service'
import type { Usuario, LoginData, RegistroData, AuthState } from '../types'

// Context para Auth global
interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
  temPermissao: (permissao: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

// Provider
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

// Hook para login (pode ser usado sem provider)
export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAuthRepository(supabase)
  const service = createAuthService(repository)
  const router = useRouter()

  const login = useCallback(async (data: LoginData) => {
    setLoading(true)
    setError(null)
    try {
      await service.login(data)
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [router])

  return { login, loading, error }
}

// Hook para registro
export function useRegistro() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAuthRepository(supabase)
  const service = createAuthService(repository)

  const registrar = useCallback(async (data: RegistroData) => {
    setLoading(true)
    setError(null)
    try {
      const usuario = await service.registrar(data)
      return usuario
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { registrar, loading, error }
}

// Hook para gestão de usuários
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAuthRepository(supabase)
  const service = createAuthService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listarUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return { usuarios, loading, error, recarregar: carregar }
}

// Hook para mutations de usuários
export function useUsuariosMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = createAuthRepository(supabase)
  const service = createAuthService(repository)

  const criar = useCallback(async (data: RegistroData & { is_admin?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const usuario = await service.criarUsuario(data)
      return usuario
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<Usuario>) => {
    setLoading(true)
    setError(null)
    try {
      const usuario = await service.atualizarUsuario(id, data)
      return usuario
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizarPermissoes = useCallback(async (id: string, permissoes: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const usuario = await service.atualizarPermissoes(id, permissoes)
      return usuario
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissões'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const desativar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.desativarUsuario(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desativar usuário'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.excluirUsuario(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir usuário'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { criar, atualizar, atualizarPermissoes, desativar, excluir, loading, error }
}
