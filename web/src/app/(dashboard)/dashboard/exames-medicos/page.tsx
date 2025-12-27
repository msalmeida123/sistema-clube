'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Eye, Edit, Trash2, Stethoscope, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

type ExameMedico = {
  id: string
  associado_id: string
  data_exame: string
  data_validade: string
  medico_nome: string
  crm: string
  tipo_exame: string
  resultado: string
  observacoes: string
  arquivo_url: string | null
  associado: {
    id: string
    nome: string
    numero_titulo: number
  }
}

export default function ExamesMedicosPage() {
  const [exames, setExames] = useState<ExameMedico[]>([])
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'validos' | 'vencidos' | 'vencer'>('todos')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchExames = async () => {
    const { data } = await supabase
      .from('exames_medicos')
      .select('*, associado:associados(id, nome, numero_titulo)')
      .order('data_validade', { ascending: true })

    let resultado = data || []
    
    // Filtrar por busca
    if (search) {
      resultado = resultado.filter((e: any) =>
        e.associado?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        e.medico_nome?.toLowerCase().includes(search.toLowerCase()) ||
        e.crm?.includes(search)
      )
    }

    // Filtrar por status
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const em30dias = new Date()
    em30dias.setDate(em30dias.getDate() + 30)

    if (filtro === 'validos') {
      resultado = resultado.filter((e: any) => new Date(e.data_validade) >= hoje)
    } else if (filtro === 'vencidos') {
      resultado = resultado.filter((e: any) => new Date(e.data_validade) < hoje)
    } else if (filtro === 'vencer') {
      resultado = resultado.filter((e: any) => {
        const validade = new Date(e.data_validade)
        return validade >= hoje && validade <= em30dias
      })
    }

    setExames(resultado as ExameMedico[])
    setLoading(false)
  }

  useEffect(() => {
    fetchExames()
  }, [supabase, search, filtro])

  const excluirExame = async (id: string) => {
    if (!confirm('Deseja excluir este exame médico?')) return

    const { error } = await supabase.from('exames_medicos').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir exame')
    } else {
      toast.success('Exame excluído')
      fetchExames()
    }
  }

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  const getStatusExame = (dataValidade: string) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validade = new Date(dataValidade)
    const em30dias = new Date()
    em30dias.setDate(em30dias.getDate() + 30)

    if (validade < hoje) {
      return { status: 'vencido', cor: 'bg-red-100 text-red-800', icon: XCircle }
    } else if (validade <= em30dias) {
      return { status: 'a vencer', cor: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    } else {
      return { status: 'válido', cor: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  const diasParaVencer = (dataValidade: string) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validade = new Date(dataValidade)
    const diff = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Contadores
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30dias = new Date()
  em30dias.setDate(em30dias.getDate() + 30)
  
  const totalValidos = exames.filter(e => new Date(e.data_validade) >= hoje).length
  const totalVencidos = exames.filter(e => new Date(e.data_validade) < hoje).length
  const totalAVencer = exames.filter(e => {
    const v = new Date(e.data_validade)
    return v >= hoje && v <= em30dias
  }).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-7 w-7" />
          Exames Médicos
        </h1>
        <Link href="/dashboard/exames-medicos/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Exame</Button>
        </Link>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFiltro('todos')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-3xl font-bold">{exames.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFiltro('validos')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-3xl font-bold">{totalValidos}</p>
                <p className="text-sm text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFiltro('vencer')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-3xl font-bold">{totalAVencer}</p>
                <p className="text-sm text-muted-foreground">A Vencer (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFiltro('vencidos')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-3xl font-bold">{totalVencidos}</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por associado ou médico..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'validos', label: 'Válidos' },
            { id: 'vencer', label: 'A Vencer' },
            { id: 'vencidos', label: 'Vencidos' },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filtro === f.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro(f.id as any)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Exames ({exames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : exames.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum exame encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Associado</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Data Exame</th>
                    <th className="text-left py-3 px-4">Validade</th>
                    <th className="text-left py-3 px-4">Médico</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {exames.map((e) => {
                    const statusInfo = getStatusExame(e.data_validade)
                    const dias = diasParaVencer(e.data_validade)
                    return (
                      <tr key={e.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{e.associado?.nome}</p>
                          <p className="text-sm text-muted-foreground">Título: {e.associado?.numero_titulo}</p>
                        </td>
                        <td className="py-3 px-4">{e.tipo_exame || 'Piscina'}</td>
                        <td className="py-3 px-4">{formatarData(e.data_exame)}</td>
                        <td className="py-3 px-4">
                          <p>{formatarData(e.data_validade)}</p>
                          <p className="text-xs text-muted-foreground">
                            {dias > 0 ? `${dias} dias restantes` : dias === 0 ? 'Vence hoje' : `Vencido há ${Math.abs(dias)} dias`}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p>{e.medico_nome}</p>
                          <p className="text-sm text-muted-foreground">CRM: {e.crm}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusInfo.cor}`}>
                            <statusInfo.icon className="h-3 w-3" />
                            {statusInfo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Link href={`/dashboard/exames-medicos/${e.id}`}>
                              <Button variant="ghost" size="icon" title="Ver">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/exames-medicos/${e.id}/editar`}>
                              <Button variant="ghost" size="icon" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              onClick={() => excluirExame(e.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
