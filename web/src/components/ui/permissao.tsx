// Componentes de UI com controle de permissão
'use client'

import { ReactNode } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { usePermissaoPagina } from '@/modules/auth'
import { Loader2, Lock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PermissaoButtonProps extends ButtonProps {
  codigoPagina: string
  acao: 'criar' | 'editar' | 'excluir'
  children: ReactNode
  mostrarBloqueado?: boolean
}

/**
 * Botão que só aparece se o usuário tiver permissão para a ação
 */
export function BotaoComPermissao({
  codigoPagina,
  acao,
  children,
  mostrarBloqueado = false,
  ...props
}: PermissaoButtonProps) {
  const { loading, podeCriar, podeEditar, podeExcluir } = usePermissaoPagina(codigoPagina)

  if (loading) {
    return (
      <Button {...props} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  const temPermissao = 
    (acao === 'criar' && podeCriar) ||
    (acao === 'editar' && podeEditar) ||
    (acao === 'excluir' && podeExcluir)

  if (!temPermissao) {
    if (mostrarBloqueado) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button {...props} disabled variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                {children}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Você não tem permissão para {acao}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return null
  }

  return <Button {...props}>{children}</Button>
}

interface PermissaoWrapperProps {
  codigoPagina: string
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir'
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper que só renderiza o children se o usuário tiver permissão
 */
export function ComPermissao({
  codigoPagina,
  acao,
  children,
  fallback = null
}: PermissaoWrapperProps) {
  const { loading, podeVisualizar, podeCriar, podeEditar, podeExcluir } = usePermissaoPagina(codigoPagina)

  if (loading) {
    return <>{fallback}</>
  }

  const temPermissao = 
    (acao === 'visualizar' && podeVisualizar) ||
    (acao === 'criar' && podeCriar) ||
    (acao === 'editar' && podeEditar) ||
    (acao === 'excluir' && podeExcluir)

  if (!temPermissao) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface PaginaProtegidaProps {
  codigoPagina: string
  children: ReactNode
}

/**
 * Componente que protege uma página inteira
 * Se o usuário não tiver permissão de visualizar, mostra mensagem de acesso negado
 */
export function PaginaProtegida({ codigoPagina, children }: PaginaProtegidaProps) {
  const { loading, podeVisualizar, isAdmin } = usePermissaoPagina(codigoPagina)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!podeVisualizar && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Lock className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Acesso Negado</h2>
        <p className="text-gray-500 mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook para usar em componentes que precisam verificar múltiplas permissões
 */
export { usePermissaoPagina, usePermissoesCRUD } from '@/modules/auth'
