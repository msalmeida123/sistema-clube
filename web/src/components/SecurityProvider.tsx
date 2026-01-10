'use client'

import { useEffect } from 'react'
import { initClientProtection } from '@/lib/console-protection'

interface SecurityProviderProps {
  children: React.ReactNode
}

/**
 * Provider de Segurança
 * Ativa proteções contra DevTools e manipulação do console
 */
export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Debug log
    console.log('[SecurityProvider] Iniciando proteções...')
    
    // Aguarda o DOM estar completamente carregado
    if (document.readyState === 'complete') {
      initClientProtection()
    } else {
      window.addEventListener('load', () => {
        initClientProtection()
      })
    }
  }, [])

  return <>{children}</>
}

export default SecurityProvider
