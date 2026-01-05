import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

type Associado = {
  id: string
  nome: string
  email: string
  cpf: string
  telefone: string
  numero_titulo: string
  qr_code: string
  foto_url?: string
  status: string
  plano?: {
    nome: string
    valor: number
  }
}

type AuthContextType = {
  associado: Associado | null
  loading: boolean
  signIn: (cpf: string, senha: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (cpf: string) => Promise<{ success: boolean; error?: string; email?: string }>
  refreshAssociado: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadAssociado(session.user.email!)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssociado = async (email: string) => {
    const { data, error } = await supabase
      .from('associados')
      .select('*, plano:planos(nome, valor)')
      .eq('email', email)
      .single()

    if (data && !error) {
      setAssociado(data)
    }
  }

  const signIn = async (cpf: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Buscar associado pelo CPF
      const { data: assocData, error: assocError } = await supabase
        .from('associados')
        .select('*, plano:planos(nome, valor)')
        .eq('cpf', cpf.replace(/\D/g, ''))
        .single()

      if (assocError || !assocData) {
        return { success: false, error: 'CPF não encontrado' }
      }

      if (!assocData.email) {
        return { success: false, error: 'Associado sem email cadastrado' }
      }

      // Fazer login com email/senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email: assocData.email,
        password: senha,
      })

      if (error) {
        if (error.message.includes('Invalid login')) {
          return { success: false, error: 'Senha incorreta' }
        }
        return { success: false, error: error.message }
      }

      setAssociado(assocData)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: 'Erro ao fazer login' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAssociado(null)
  }

  const resetPassword = async (cpf: string): Promise<{ success: boolean; error?: string; email?: string }> => {
    try {
      // Buscar associado pelo CPF
      const { data: assocData, error: assocError } = await supabase
        .from('associados')
        .select('email, nome')
        .eq('cpf', cpf.replace(/\D/g, ''))
        .single()

      if (assocError || !assocData) {
        return { success: false, error: 'CPF não encontrado' }
      }

      if (!assocData.email) {
        return { success: false, error: 'Associado sem email cadastrado. Entre em contato com a secretaria.' }
      }

      // Gerar nova senha aleatória
      const novaSenha = Math.random().toString(36).slice(-8)

      // Atualizar senha no Supabase Auth (precisa de função no backend)
      // Por enquanto, vamos usar o reset do Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(assocData.email, {
        redirectTo: 'clubeassociado://reset-password',
      })

      if (error) {
        return { success: false, error: 'Erro ao enviar email de recuperação' }
      }

      // Mascarar email para exibição
      const emailMascarado = assocData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

      return { success: true, email: emailMascarado }
    } catch (error: any) {
      return { success: false, error: 'Erro ao recuperar senha' }
    }
  }

  const refreshAssociado = async () => {
    if (associado?.email) {
      await loadAssociado(associado.email)
    }
  }

  return (
    <AuthContext.Provider value={{ associado, loading, signIn, signOut, resetPassword, refreshAssociado }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
