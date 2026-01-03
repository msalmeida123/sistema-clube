// Componente Card de Validação - Exibe resultado da validação
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, AlertTriangle, LogIn, LogOut } from 'lucide-react'
import type { ValidacaoAcesso } from '../types'

interface ValidacaoCardProps {
  validacao: ValidacaoAcesso
  onRegistrarEntrada?: () => void
  onRegistrarSaida?: () => void
  onLimpar?: () => void
  loading?: boolean
}

export function ValidacaoCard({ 
  validacao, 
  onRegistrarEntrada,
  onRegistrarSaida,
  onLimpar,
  loading 
}: ValidacaoCardProps) {
  const { permitido, pessoa, motivo, alertas } = validacao

  return (
    <Card className={`border-2 ${permitido ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Ícone de status */}
          <div className={`p-4 rounded-full ${permitido ? 'bg-green-100' : 'bg-red-100'}`}>
            {permitido ? (
              <Check className="h-12 w-12 text-green-600" />
            ) : (
              <X className="h-12 w-12 text-red-600" />
            )}
          </div>

          {/* Dados da pessoa */}
          {pessoa && (
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={pessoa.foto_url} />
                <AvatarFallback className="text-2xl">
                  {pessoa.nome?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{pessoa.nome}</h3>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                  ${pessoa.tipo === 'associado' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {pessoa.tipo}
                </span>
                {pessoa.numero_titulo && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100">
                    Título: {pessoa.numero_titulo}
                  </span>
                )}
              </div>
              {pessoa.titular_nome && (
                <p className="text-sm text-muted-foreground">
                  Titular: {pessoa.titular_nome}
                </p>
              )}
            </div>
          )}

          {/* Mensagem de status */}
          <p className={`text-lg font-medium ${permitido ? 'text-green-700' : 'text-red-700'}`}>
            {permitido ? '✓ Acesso Liberado' : `✗ ${motivo || 'Acesso Negado'}`}
          </p>

          {/* Alertas */}
          {alertas && alertas.length > 0 && (
            <div className="w-full space-y-1">
              {alertas.map((alerta, i) => (
                <div key={i} className="flex items-center gap-2 text-yellow-700 bg-yellow-100 px-3 py-1 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{alerta}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botões de ação */}
          {permitido && pessoa && (
            <div className="flex gap-2 pt-4">
              {onRegistrarEntrada && (
                <Button 
                  onClick={onRegistrarEntrada} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Registrar Entrada
                </Button>
              )}
              {onRegistrarSaida && (
                <Button 
                  onClick={onRegistrarSaida} 
                  disabled={loading}
                  variant="outline"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Registrar Saída
                </Button>
              )}
            </div>
          )}

          {/* Botão limpar */}
          {onLimpar && (
            <Button variant="ghost" onClick={onLimpar} className="mt-2">
              Nova Consulta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
