// Hooks Auth - Responsáveis APENAS por gerenciar estado React (sem JSX)
'use client'

import { useState, useEffect, useCallback, useContext } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createAuthRepository } from '../repositories/auth.repository'
import { createAuthService } from '../services/auth.service'
import type { Usuario, LoginData, RegistroData } from '../types'
import { AuthContext } from '../components/AuthProvider'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
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
