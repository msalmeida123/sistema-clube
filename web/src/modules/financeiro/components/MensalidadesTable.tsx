// Componente Tabela Mensalidades - Responsável APENAS por renderizar
'use client'

import { Button } from '@/components/ui/button'
import { Check, X, Eye, Percent } from 'lucide-react'
import type { Mensalidade } from '../types'

interface MensalidadesTableProps {
  mensalidades: Mensalidade[]
  loading?: boolean
  onPagar?: (id: string) => void
  onCancelar?: (id: string) => void
  onDesconto?: (id: string) => void
  onDetalhes?: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  atrasado: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function MensalidadesTable({
  mensalidades,
  loading,
  onPagar,
  onCancelar,
  onDesconto,
  onDetalhes
}: MensalidadesTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (mensalidades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma mensalidade encontrada
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Associado</th>
            <th className="text-left py-3 px-4">Referência</th>
            <th className="text-left py-3 px-4">Vencimento</th>
            <th className="text-right py-3 px-4">Valor</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {mensalidades.map((mensalidade) => (
            <MensalidadeRow
              key={mensalidade.id}
              mensalidade={mensalidade}
              onPagar={onPagar}
              onCancelar={onCancelar}
              onDesconto={onDesconto}
              onDetalhes={onDetalhes}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface MensalidadeRowProps {
  mensalidade: Mensalidade
  onPagar?: (id: string) => void
  onCancelar?: (id: string) => void
  onDesconto?: (id: string) => void
  onDetalhes?: (id: string) => void
}

function MensalidadeRow({
  mensalidade,
  onPagar,
  onCancelar,
  onDesconto,
  onDetalhes
}: MensalidadeRowProps) {
  const isAtrasado = mensalidade.status === 'pendente' && 
    new Date(mensalidade.data_vencimento) < new Date()

  const status = isAtrasado ? 'atrasado' : mensalidade.status

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <p className="font-medium">{mensalidade.associado_nome || '-'}</p>
      </td>
      <td className="py-3 px-4 font-mono">{mensalidade.referencia}</td>
      <td className="py-3 px-4">{formatDate(mensalidade.data_vencimento)}</td>
      <td className="py-3 px-4 text-right font-medium">
        {formatCurrency(mensalidade.valor)}
        {mensalidade.desconto && mensalidade.desconto > 0 && (
          <span className="text-xs text-green-600 block">
            -{formatCurrency(mensalidade.desconto)}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {mensalidade.status === 'pendente' && (
            <>
              {onPagar && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Registrar pagamento"
                  onClick={() => onPagar(mensalidade.id)}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {onDesconto && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Aplicar desconto"
                  onClick={() => onDesconto(mensalidade.id)}
                >
                  <Percent className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              {onCancelar && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Cancelar"
                  onClick={() => onCancelar(mensalidade.id)}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </>
          )}
          {onDetalhes && (
            <Button 
              variant="ghost" 
              size="icon" 
              title="Ver detalhes"
              onClick={() => onDetalhes(mensalidade.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
