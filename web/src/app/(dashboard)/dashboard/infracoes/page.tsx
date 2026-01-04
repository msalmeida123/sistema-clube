'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaginaProtegida, ComPermissao } from '@/components/ui/permissao'
import { Plus, Search, Eye, AlertTriangle, Clock, CheckCircle, Archive } from 'lucide-react'

type Infracao = {
  id: string
  data_ocorrencia: string
  local_ocorrencia: string
  gravidade_sugerida: string
  status: string
  penalidade_aplicada: string | null
  associado: { id: string; nome: string; numero_titulo: number }
}

export default function InfracoesPage() {
  const [infracoes, setInfracoes] = useState<Infracao[]>([])
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchInfracoes = async () => {
      let query = supabase
        .from('infracoes')
        .select('id, data_ocorrencia, local_ocorrencia, gravidade_sugerida, status, penalidade_aplicada, associado:associados(id, nome, numero_titulo)')
        .order('data_ocorrencia', { ascending: false })

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus)
      }

      const { data } = await query
      
      let resultado = data || []
      if (search) {
        resultado = resultado.filter((i: any) => 
          i.associado?.nome?.toLowerCase().includes(search.toLowerCase()) ||
          i.local_ocorrencia?.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setInfracoes(resultado as any)
      setLoading(false)
    }
    fetchInfracoes()
  }, [supabase, search, filtroStatus])

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pendente: <Clock className="h-4 w-4 text-yellow-600" />,
      em_analise: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      julgado: <CheckCircle className="h-4 w-4 text-green-600" />,
      arquivado: <Archive className="h-4 w-4 text-gray-600" />,
    }
    return icons[status] || null
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_analise: 'bg-orange-100 text-orange-800',
      julgado: 'bg-green-100 text-green-800',
      arquivado: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100'
  }

  const getGravidadeColor = (gravidade: string) => {
    const colors: Record<string, string> = {
      leve: 'bg-blue-100 text-blue-800',
      media: 'bg-yellow-100 text-yellow-800',
      grave: 'bg-orange-100 text-orange-800',
      gravissima: 'bg-red-100 text-red-800',
    }
    return colors[gravidade] || 'bg-gray-100'
  }

  const getPenalidadeColor = (penalidade: string | null) => {
    if (!penalidade) return ''
    const colors: Record<string, string> = {
      absolvido: 'bg-green-100 text-green-800',
      admoestacao: 'bg-blue-100 text-blue-800',
      suspensao: 'bg-yellow-100 text-yellow-800',
      eliminacao: 'bg-orange-100 text-orange-800',
      expulsao: 'bg-red-100 text-red-800',
    }
    return colors[penalidade] || 'bg-gray-100'
  }

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_analise: 'Em Análise',
    julgado: 'Julgado',
    arquivado: 'Arquivado',
  }

  const gravidadeLabels: Record<string, string> = {
    leve: 'Leve',
    media: 'Média',
    grave: 'Grave',
    gravissima: 'Gravíssima',
  }

  const penalidadeLabels: Record<string, string> = {
    absolvido: 'Absolvido',
    admoestacao: 'Admoestação',
    suspensao: 'Suspensão',
    eliminacao: 'Eliminação',
    expulsao: 'Expulsão',
  }

  return (
    <PaginaProtegida codigoPagina="infracoes">
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registro de Infrações</h1>
        <ComPermissao codigoPagina="infracoes" acao="criar">
          <Link href="/dashboard/infracoes/nova">
            <Button><Plus className="h-4 w-4 mr-2" />Nova Ocorrência</Button>
          </Link>
        </ComPermissao>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por associado ou local..." 
            className="pl-10" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'pendente', 'em_analise', 'julgado', 'arquivado'].map((status) => (
            <Button
              key={status}
              variant={filtroStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus(status)}
            >
              {status === 'todos' ? 'Todos' : statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{infracoes.filter(i => i.status === 'pendente').length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{infracoes.filter(i => i.status === 'em_analise').length}</p>
                <p className="text-sm text-muted-foreground">Em Análise</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{infracoes.filter(i => i.status === 'julgado').length}</p>
                <p className="text-sm text-muted-foreground">Julgados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{infracoes.filter(i => i.status === 'arquivado').length}</p>
                <p className="text-sm text-muted-foreground">Arquivados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader><CardTitle>Ocorrências ({infracoes.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : infracoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma infração registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Associado</th>
                    <th className="text-left py-3 px-4">Local</th>
                    <th className="text-left py-3 px-4">Gravidade</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Penalidade</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {infracoes.map((i: any) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatarData(i.data_ocorrencia)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{i.associado?.nome}</p>
                          <p className="text-sm text-muted-foreground">Título: {i.associado?.numero_titulo}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{i.local_ocorrencia}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGravidadeColor(i.gravidade_sugerida)}`}>
                          {gravidadeLabels[i.gravidade_sugerida] || i.gravidade_sugerida}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(i.status)}`}>
                          {getStatusIcon(i.status)}
                          {statusLabels[i.status] || i.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {i.penalidade_aplicada ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPenalidadeColor(i.penalidade_aplicada)}`}>
                            {penalidadeLabels[i.penalidade_aplicada] || i.penalidade_aplicada}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/infracoes/${i.id}`}>
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PaginaProtegida>
  )
}
