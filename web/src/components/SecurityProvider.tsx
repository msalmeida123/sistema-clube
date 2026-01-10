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
    // Sempre ativa as proteções
    initClientProtection()
  }, [])

  return <>{children}</>
}

export default SecurityProvider
