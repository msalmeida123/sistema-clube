'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useWhatsAppNotifications() {
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Buscar total de mensagens não lidas
  const fetchNaoLidas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select('nao_lidas')
        .gt('nao_lidas', 0)

      if (error) {
        console.error('Erro ao buscar não lidas:', error)
        return
      }

      const total = data?.reduce((acc, conv) => acc + (conv.nao_lidas || 0), 0) || 0
      setTotalNaoLidas(total)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Buscar inicial
    fetchNaoLidas()

    // Configurar Realtime para atualizações
    const channel = supabase
      .channel('whatsapp-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas_whatsapp'
        },
        (payload) => {
          console.log('Mudança em conversas_whatsapp:', payload)
          fetchNaoLidas()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp',
          filter: 'direcao=eq.entrada'
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload)
          fetchNaoLidas()
          
          // Tocar som de notificação (opcional)
          try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch (e) {}
        }
      )
      .subscribe()

    // Polling como fallback (a cada 30 segundos)
    const interval = setInterval(fetchNaoLidas, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase, fetchNaoLidas])

  return {
    totalNaoLidas,
    loading,
    refetch: fetchNaoLidas
  }
}
