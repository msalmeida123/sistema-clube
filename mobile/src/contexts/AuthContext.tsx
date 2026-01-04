import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Usuario = {
  id: string
  auth_id: string
  nome: string
  email: string
  is_admin: boolean
  permissoes: string[]
  ativo: boolean
}

type AuthContextType = {
  session: Session | null
  user: User | null
  usuario: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        carregarUsuario(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        carregarUsuario(session.user.id)
      } else {
        setUsuario(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const carregarUsuario = async (authId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (data && !error) {
      setUsuario(data)
    }
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, usuario, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
