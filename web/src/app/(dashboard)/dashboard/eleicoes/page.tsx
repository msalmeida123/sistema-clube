'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { PaginaProtegida, ComPermissao } from '@/components/ui/permissao'
import { Plus, Vote, Trophy, Calendar, Users, Clock, CheckCircle, XCircle, Eye, BarChart3, X } from 'lucide-react'
import Link from 'next/link'

type Eleicao = {
  id: string
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  status: string
  created_at: string
  chapas?: Chapa[]
  total_votos?: number
}

type Chapa = {
  id: string
  eleicao_id: string
  numero: number
  nome: string
  presidente: string
  vice_presidente: string
  votos: number
}

const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-'
const formatDateTime = (date: string) => date ? new Date(date).toLocaleString('pt-BR') : '-'

export default function EleicoesPage() {
  const [eleicoes, setEleicoes] = useState<Eleicao[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovaEleicao, setShowNovaEleicao] = useState(false)
  const [novaEleicao, setNovaEleicao] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEleicoes()
  }, [])

  const fetchEleicoes = async () => {
    const { data: eleicoesData } = await supabase
      .from('eleicoes')
      .select('*, chapas(*)')
      .order('created_at', { ascending: false })

    if (eleicoesData) {
      const eleicoesComVotos = eleicoesData.map(e => ({
        ...e,
        total_votos: e.chapas?.reduce((acc: number, c: Chapa) => acc + (c.votos || 0), 0) || 0
      }))
      setEleicoes(eleicoesComVotos)
    }
    setLoading(false)
  }

  const criarEleicao = async () => {
    if (!novaEleicao.titulo || !novaEleicao.data_inicio || !novaEleicao.data_fim) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const { error } = await supabase.from('eleicoes').insert({
      titulo: novaEleicao.titulo,
      descricao: novaEleicao.descricao,
      data_inicio: novaEleicao.data_inicio,
      data_fim: novaEleicao.data_fim,
      status: 'agendada',
    })

    if (error) {
      toast.error('Erro ao criar eleição')
    } else {
      toast.success('Eleição criada!')
      setShowNovaEleicao(false)
      setNovaEleicao({ titulo: '', descricao: '', data_inicio: '', data_fim: '' })
      fetchEleicoes()
    }
  }

  const getStatusBadge = (eleicao: Eleicao) => {
    const agora = new Date()
    const inicio = new Date(eleicao.data_inicio)
    const fim = new Date(eleicao.data_fim)

    if (eleicao.status === 'encerrada') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><CheckCircle className="h-3 w-3" />Encerrada</span>
    }
    if (agora < inicio) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="h-3 w-3" />Agendada</span>
    }
    if (agora >= inicio && agora <= fim) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Vote className="h-3 w-3" />Em Votação</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" />Aguardando</span>
  }

  const stats = {
    total: eleicoes.length,
    ativas: eleicoes.filter(e => {
      const agora = new Date()
      return new Date(e.data_inicio) <= agora && new Date(e.data_fim) >= agora && e.status !== 'encerrada'
    }).length,
    agendadas: eleicoes.filter(e => new Date(e.data_inicio) > new Date()).length,
    encerradas: eleicoes.filter(e => e.status === 'encerrada').length,
  }

  return (
    <PaginaProtegida codigoPagina="eleicoes">
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Eleições</h1>
        <ComPermissao codigoPagina="eleicoes" acao="criar">
          <Button onClick={() => setShowNovaEleicao(true)}>
            <Plus className="h-4 w-4 mr-2" />Nova Eleição
          </Button>
        </ComPermissao>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Em Votação</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.agendadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Encerradas</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.encerradas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Eleições */}
      {loading ? (
        <p className="text-center py-8">Carregando...</p>
      ) : eleicoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma eleição cadastrada</p>
            <Button className="mt-4" onClick={() => setShowNovaEleicao(true)}>
              <Plus className="h-4 w-4 mr-2" />Criar Primeira Eleição
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {eleicoes.map((eleicao) => (
            <Card key={eleicao.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{eleicao.titulo}</CardTitle>
                    <CardDescription>{eleicao.descricao}</CardDescription>
                  </div>
                  {getStatusBadge(eleicao)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Início: {formatDateTime(eleicao.data_inicio)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Fim: {formatDateTime(eleicao.data_fim)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{eleicao.chapas?.length || 0} chapas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Vote className="h-4 w-4 text-muted-foreground" />
                      <span>{eleicao.total_votos} votos</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/eleicoes/${eleicao.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />Gerenciar
                      </Button>
                    </Link>
                    {eleicao.status === 'encerrada' && (
                      <Link href={`/dashboard/eleicoes/${eleicao.id}/resultado`}>
                        <Button>
                          <BarChart3 className="h-4 w-4 mr-2" />Resultado
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nova Eleição */}
      {showNovaEleicao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nova Eleição</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowNovaEleicao(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={novaEleicao.titulo}
                  onChange={(e) => setNovaEleicao({ ...novaEleicao, titulo: e.target.value })}
                  placeholder="Ex: Eleição Diretoria 2025-2027"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={novaEleicao.descricao}
                  onChange={(e) => setNovaEleicao({ ...novaEleicao, descricao: e.target.value })}
                  placeholder="Descrição da eleição"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Início da Votação *</Label>
                  <Input
                    type="datetime-local"
                    value={novaEleicao.data_inicio}
                    onChange={(e) => setNovaEleicao({ ...novaEleicao, data_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fim da Votação *</Label>
                  <Input
                    type="datetime-local"
                    value={novaEleicao.data_fim}
                    onChange={(e) => setNovaEleicao({ ...novaEleicao, data_fim: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNovaEleicao(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={criarEleicao} className="flex-1">
                  Criar Eleição
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </PaginaProtegida>
  )
}
