'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'

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
    setIsAdmin(false)
    setSetoresPermitidos([])
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }


      const usuario = await buscarUsuarioAtual<{ id: string; is_admin: boolean; ativo: boolean }>(
        supabase, user.id, 'id, is_admin, ativo'
      )

      if (!usuario?.ativo) {
        console.error('useSetoresUsuario: Usuário não encontrado no banco')
        setLoading(false)
        return
      }


      if (usuario.is_admin) {
        setIsAdmin(true)
        const { data: todosSetores, error } = await supabase
          .from('setores_whatsapp')
          .select('id')
          .eq('ativo', true)
        if (error) throw error


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
        const { data: setoresUsuario, error } = await supabase
          .from('usuarios_setores')
          .select('setor_id, is_responsavel')
          .eq('usuario_id', usuario.id)
        if (error) throw error


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
      setIsAdmin(false)
      setSetoresPermitidos([])
      console.error('useSetoresUsuario: Erro:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarSetores()
  }, [carregarSetores])

  const podeVerSetor = useCallback((setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.length > 0
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_ver)
  }, [isAdmin, setoresPermitidos])

  const podeResponderSetor = useCallback((setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_responder)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_responder)
  }, [isAdmin, setoresPermitidos])

  const podeTransferirSetor = useCallback((setorId: string | null): boolean => {
    if (isAdmin) return true
    if (setorId === null) return setoresPermitidos.some(s => s.pode_transferir)
    return setoresPermitidos.some(s => s.setor_id === setorId && s.pode_transferir)
  }, [isAdmin, setoresPermitidos])

  const getSetorIds = useCallback((): string[] => {
    return setoresPermitidos.filter(s => s.pode_ver).map(s => s.setor_id)
  }, [setoresPermitidos])

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
