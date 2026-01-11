'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type SetorPermissao = {
  setor_id: string
  pode_ver: boolean
  pode_responder: boolean
  pode_transferir: boolean
  ve_todos: boolean
}

export function useSetoresUsuario() {
  const [setoresPermitidos, setSetoresPermitidos] = useState<SetorPermissao[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientComponentClient()

  const carregarSetores = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('useSetoresUsuario: Nenhum usuário logado')
        setLoading(false)
        return
      }

      console.log('useSetoresUsuario: Usuário logado:', user.email)

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, is_admin')
        .eq('auth_id', user.id)
        .single()

      if (!usuario) {
        console.error('useSetoresUsuario: Usuário não encontrado no banco')
        setLoading(false)
        return
      }

      console.log('useSetoresUsuario: is_admin =', usuario.is_admin)

      if (usuario.is_admin) {
        setIsAdmin(true)
        const { data: todosSetores } = await supabase
          .from('setores_whatsapp')
          .select('id')
          .eq('ativo', true)

        console.log('useSetoresUsuario: Setores para admin:', todosSetores?.length || 0)

        setSetoresPermitidos(
          (todosSetores || []).map(s => ({
            setor_id: s.id,
            pode_ver: true,
            pode_responder: true,
            pode_transferir: true,
            ve_todos: true
          }))
        )
      } else {
        setIsAdmin(false)
        const { data: setoresUsuario } = await supabase
          .from('usuarios_setores')
          .select('setor_id, is_responsavel')
          .eq('usuario_id', usuario.id)

        console.log('useSetoresUsuario: Setores do usuário:', setoresUsuario?.length || 0)

        setSetoresPermitidos(
          (setoresUsuario || []).map(s => ({
            setor_id: s.setor_id,
            pode_ver: true,
            pode_responder: true,
            pode_transferir: s.is_responsavel || false,
            ve_todos: false
          }))
        )
      }
    } catch (error) {
      console.error('useSetoresUsuario: Erro:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarSetores()
  }, [carregarSetores])

  const podeVerSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.length > 0
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_ver)
  }

  const podeResponderSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_responder)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_responder)
  }

  const podeTransferirSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_transferir)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_transferir)
  }

  const getSetorIds = (): string[] => {
    return setoresPermitidos.filter(s => s.pode_ver).map(s => s.setor_id)
  }

  return {
    setoresPermitidos,
    loading,
    isAdmin,
    podeVerSetor,
    podeResponderSetor,
    podeTransferirSetor,
    getSetorIds,
    recarregar: carregarSetores
  }
}
