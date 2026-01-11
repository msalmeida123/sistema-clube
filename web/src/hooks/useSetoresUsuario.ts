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
        console.log('useSetoresUsuario: Nenhum usuário logado')
        setLoading(false)
        return
      }

      console.log('useSetoresUsuario: Usuário logado:', user.email)

      // Verificar se é admin
      const { data: usuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .select('is_admin')
        .eq('auth_id', user.id)
        .single()

      if (erroUsuario) {
        console.error('useSetoresUsuario: Erro ao buscar usuário:', erroUsuario)
      }

      console.log('useSetoresUsuario: is_admin =', usuario?.is_admin)

      if (usuario?.is_admin) {
        setIsAdmin(true)
        // Admin vê todos os setores
        const { data: todosSetores, error: erroSetores } = await supabase
          .from('setores_whatsapp')
          .select('id')
          .eq('ativo', true)

        if (erroSetores) {
          console.error('useSetoresUsuario: Erro ao buscar setores:', erroSetores)
        }

        console.log('useSetoresUsuario: Setores encontrados para admin:', todosSetores?.length || 0)

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
        // Buscar setores associados ao usuário na tabela usuarios_setores
        const { data: setoresUsuario, error: erroSetoresUsuario } = await supabase
          .from('usuarios_setores')
          .select('setor_id, is_responsavel')
          .eq('usuario_id', usuario?.id || user.id)

        if (erroSetoresUsuario) {
          console.error('useSetoresUsuario: Erro ao buscar setores do usuário:', erroSetoresUsuario)
        }

        console.log('useSetoresUsuario: Setores do usuário não-admin:', setoresUsuario?.length || 0)

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
      console.error('useSetoresUsuario: Erro ao carregar setores:', error)
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
