'use client'

import { useEffect } from 'react'
import { initClientProtection } from '@/lib/console-protection'

interface SecurityProviderProps {
  children: React.ReactNode
  enableProtection?: boolean
}

/**
 * Provider de Segurança
 * 
 * Envolva sua aplicação com este componente para ativar proteções do cliente.
 * 
 * Uso:
 * ```tsx
 * <SecurityProvider>
 *   <App />
 * </SecurityProvider>
 * ```
 */
export function SecurityProvider({ 
  children, 
  enableProtection = true
}: SecurityProviderProps) {
  useEffect(() => {
    // Sempre ativa as proteções (exceto em desenvolvimento local)
    const isDev = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (enableProtection && !isDev) {
      initClientProtection()
    }
  }, [enableProtection])

  return <>{children}</>
}

export default SecurityProvider
