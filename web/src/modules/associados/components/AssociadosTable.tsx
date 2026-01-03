// Componente de Tabela - Responsável APENAS por renderizar dados
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, Edit, CreditCard, FileText } from 'lucide-react'
import type { Associado } from '../types'

interface AssociadosTableProps {
  associados: Associado[]
  loading?: boolean
  onView?: (id: string) => void
  onEdit?: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-gray-100 text-gray-800',
  suspenso: 'bg-yellow-100 text-yellow-800',
  expulso: 'bg-red-100 text-red-800',
}

const PLANO_COLORS: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-800',
  familiar: 'bg-green-100 text-green-800',
  patrimonial: 'bg-yellow-100 text-yellow-800',
}

function formatCPF(cpf: string): string {
  const cpfLimpo = cpf?.replace(/\D/g, '') || ''
  if (cpfLimpo.length !== 11) return cpf
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function AssociadosTable({ associados, loading, onView, onEdit }: AssociadosTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (associados.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum associado encontrado
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Associado</th>
            <th className="text-left py-3 px-4">Título</th>
            <th className="text-left py-3 px-4">CPF</th>
            <th className="text-left py-3 px-4">Plano</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {associados.map((associado) => (
            <AssociadoRow
              key={associado.id}
              associado={associado}
              onView={onView}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface AssociadoRowProps {
  associado: Associado
  onView?: (id: string) => void
  onEdit?: (id: string) => void
}

function AssociadoRow({ associado, onView, onEdit }: AssociadoRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={associado.foto_url} />
            <AvatarFallback>{associado.nome?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{associado.nome}</p>
            <p className="text-sm text-muted-foreground">{associado.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 font-mono">{associado.numero_titulo}</td>
      <td className="py-3 px-4">{formatCPF(associado.cpf)}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${PLANO_COLORS[associado.plano] || 'bg-gray-100'}`}>
          {associado.plano}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[associado.status] || 'bg-gray-100'}`}>
          {associado.status}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          <Link href={`/dashboard/associados/${associado.id}`}>
            <Button variant="ghost" size="icon" title="Ver detalhes">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/associados/${associado.id}/editar`}>
            <Button variant="ghost" size="icon" title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/associados/${associado.id}/carteirinha`}>
            <Button variant="ghost" size="icon" title="Carteirinha">
              <CreditCard className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/associados/${associado.id}/contrato`}>
            <Button variant="ghost" size="icon" title="Contrato">
              <FileText className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  )
}
