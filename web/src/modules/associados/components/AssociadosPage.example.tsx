// Página de Associados - REFATORADA
// Agora a página só orquestra os componentes, sem lógica de negócio
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

// Imports do módulo - tudo organizado
import { 
  useAssociados, 
  AssociadosTable, 
  AssociadoSearch 
} from '@/modules/associados'

export default function AssociadosPage() {
  const [search, setSearch] = useState('')
  const { associados, loading, error } = useAssociados({ search })

  return (
    <div className="p-6 space-y-6">
      {/* Header com busca e botão */}
      <div className="flex justify-between items-center">
        <AssociadoSearch value={search} onChange={setSearch} />
        <Link href="/dashboard/associados/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Associado
          </Button>
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Associados ({associados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AssociadosTable 
            associados={associados} 
            loading={loading} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
