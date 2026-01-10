'use client'

import { useEffect } from 'react'
import { initClientProtection } from '@/lib/console-protection'

interface SecurityProviderProps {
  children: React.ReactNode
  enableConsoleProtection?: boolean
  enableDevToolsDetection?: boolean
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
  enableConsoleProtection = true,
  enableDevToolsDetection = true 
}: SecurityProviderProps) {
  useEffect(() => {
    // Só ativa em produção
    if (process.env.NODE_ENV === 'production') {
      if (enableConsoleProtection) {
        initClientProtection()
      }
    }
  }, [enableConsoleProtection, enableDevToolsDetection])

  return <>{children}</>
}

export default SecurityProvider
