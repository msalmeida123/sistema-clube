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
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Verificar se é admin
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('is_admin')
        .eq('auth_id', user.id)
        .single()

      if (usuario?.is_admin) {
        setIsAdmin(true)
        // Admin vê todos os setores
        const { data: todosSetores } = await supabase
          .from('setores_whatsapp')
          .select('id')
          .eq('ativo', true)

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
        // Buscar setores associados ao usuário
        const { data: setoresUsuario } = await supabase
          .from('usuarios_setores_whatsapp')
          .select('setor_id, pode_ver, pode_responder, pode_transferir')
          .eq('user_id', user.id)

        setSetoresPermitidos(
          (setoresUsuario || []).map(s => ({
            ...s,
            ve_todos: false
          }))
        )
      }
    } catch (error) {
      console.error('Erro ao carregar setores do usuário:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarSetores()
  }, [carregarSetores])

  // Verifica se pode ver um setor específico
  const podeVerSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    // Conversas sem setor (NULL) podem ser vistas por todos que têm pelo menos 1 setor
    if (setorId === null) return setoresPermitidos.length > 0
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_ver)
  }

  // Verifica se pode responder em um setor
  const podeResponderSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_responder)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_responder)
  }

  // Verifica se pode transferir de um setor
  const podeTransferirSetor = (setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_transferir)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_transferir)
  }

  // Retorna os IDs dos setores que o usuário pode ver
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
