'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Vote, Trophy, Calendar, Users, Trash2, X, BarChart3, CheckCircle, Clock, StopCircle } from 'lucide-react'
import Link from 'next/link'

type Chapa = {
  id: string
  eleicao_id: string
  numero: number
  nome: string
  presidente: string
  vice_presidente: string
  secretario: string
  tesoureiro: string
  votos: number
}

type Eleicao = {
  id: string
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  status: string
}

const formatDateTime = (date: string) => date ? new Date(date).toLocaleString('pt-BR') : '-'

export default function EleicaoDetalhesPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [eleicao, setEleicao] = useState<Eleicao | null>(null)
  const [chapas, setChapas] = useState<Chapa[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovaChapa, setShowNovaChapa] = useState(false)
  const [novaChapa, setNovaChapa] = useState({
    numero: '',
    nome: '',
    presidente: '',
    vice_presidente: '',
    secretario: '',
    tesoureiro: '',
  })

  useEffect(() => {
    fetchEleicao()
  }, [id])

  const fetchEleicao = async () => {
    const { data: eleicaoData } = await supabase
      .from('eleicoes')
      .select('*')
      .eq('id', id)
      .single()

    const { data: chapasData } = await supabase
      .from('chapas')
      .select('*')
      .eq('eleicao_id', id)
      .order('numero')

    setEleicao(eleicaoData)
    setChapas(chapasData || [])
    setLoading(false)
  }

  const criarChapa = async () => {
    if (!novaChapa.numero || !novaChapa.nome || !novaChapa.presidente) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const { error } = await supabase.from('chapas').insert({
      eleicao_id: id,
      numero: parseInt(novaChapa.numero),
      nome: novaChapa.nome,
      presidente: novaChapa.presidente,
      vice_presidente: novaChapa.vice_presidente,
      secretario: novaChapa.secretario,
      tesoureiro: novaChapa.tesoureiro,
      votos: 0,
    })

    if (error) {
      toast.error('Erro ao criar chapa: ' + error.message)
    } else {
      toast.success('Chapa cadastrada!')
      setShowNovaChapa(false)
      setNovaChapa({ numero: '', nome: '', presidente: '', vice_presidente: '', secretario: '', tesoureiro: '' })
      fetchEleicao()
    }
  }

  const excluirChapa = async (chapaId: string) => {
    if (!confirm('Deseja excluir esta chapa?')) return
    
    const { error } = await supabase.from('chapas').delete().eq('id', chapaId)
    if (error) {
      toast.error('Erro ao excluir')
    } else {
      toast.success('Chapa excluída!')
      fetchEleicao()
    }
  }

  const encerrarEleicao = async () => {
    if (!confirm('Deseja encerrar esta eleição? Esta ação não pode ser desfeita.')) return

    const { error } = await supabase
      .from('eleicoes')
      .update({ status: 'encerrada' })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao encerrar')
    } else {
      toast.success('Eleição encerrada!')
      fetchEleicao()
    }
  }

  const getStatusInfo = () => {
    if (!eleicao) return { label: '', color: '', icon: Clock }
    
    const agora = new Date()
    const inicio = new Date(eleicao.data_inicio)
    const fim = new Date(eleicao.data_fim)

    if (eleicao.status === 'encerrada') {
      return { label: 'Encerrada', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    }
    if (agora < inicio) {
      return { label: 'Agendada', color: 'bg-blue-100 text-blue-800', icon: Clock }
    }
    if (agora >= inicio && agora <= fim) {
      return { label: 'Em Votação', color: 'bg-green-100 text-green-800', icon: Vote }
    }
    return { label: 'Finalizada', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  }

  const totalVotos = chapas.reduce((acc, c) => acc + (c.votos || 0), 0)
  const chapaVencedora = chapas.length > 0 ? chapas.reduce((max, c) => c.votos > max.votos ? c : max) : null

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  if (!eleicao) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Eleição não encontrada</p>
        <Link href="/dashboard/eleicoes">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    )
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/eleicoes">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{eleicao.titulo}</h1>
            <p className="text-muted-foreground">{eleicao.descricao}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
          <StatusIcon className="h-4 w-4" />{statusInfo.label}
        </span>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Início</p>
                <p className="font-medium">{formatDateTime(eleicao.data_inicio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fim</p>
                <p className="font-medium">{formatDateTime(eleicao.data_fim)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Chapas</p>
                <p className="font-medium">{chapas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Votos</p>
                <p className="font-medium">{totalVotos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Chapas Cadastradas</CardTitle>
            <CardDescription>Gerencie as chapas desta eleição</CardDescription>
          </div>
          {eleicao.status !== 'encerrada' && (
            <Button onClick={() => setShowNovaChapa(true)}>
              <Plus className="h-4 w-4 mr-2" />Nova Chapa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {chapas.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma chapa cadastrada</p>
              <Button className="mt-4" onClick={() => setShowNovaChapa(true)}>
                <Plus className="h-4 w-4 mr-2" />Cadastrar Primeira Chapa
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {chapas.map((chapa) => {
                const isVencedora = eleicao.status === 'encerrada' && chapaVencedora?.id === chapa.id
                const percentual = totalVotos > 0 ? ((chapa.votos / totalVotos) * 100).toFixed(1) : 0

                return (
                  <Card key={chapa.id} className={`${isVencedora ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                            {chapa.numero}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{chapa.nome}</CardTitle>
                            {isVencedora && (
                              <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                                <Trophy className="h-4 w-4" />Vencedora
                              </span>
                            )}
                          </div>
                        </div>
                        {eleicao.status !== 'encerrada' && (
                          <Button variant="ghost" size="icon" onClick={() => excluirChapa(chapa.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Presidente:</span>
                          <span className="font-medium">{chapa.presidente}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vice-Presidente:</span>
                          <span className="font-medium">{chapa.vice_presidente || '-'}</span>
                        </div>
                        {chapa.secretario && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Secretário:</span>
                            <span className="font-medium">{chapa.secretario}</span>
                          </div>
                        )}
                        {chapa.tesoureiro && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tesoureiro:</span>
                            <span className="font-medium">{chapa.tesoureiro}</span>
                          </div>
                        )}
                      </div>

                      {/* Barra de votos */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{chapa.votos} votos</span>
                          <span className="text-muted-foreground">{percentual}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${isVencedora ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      {eleicao.status !== 'encerrada' && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href={`/dashboard/eleicoes/${id}/votar`}>
                <Button>
                  <Vote className="h-4 w-4 mr-2" />Registrar Voto
                </Button>
              </Link>
              <Button variant="destructive" onClick={encerrarEleicao}>
                <StopCircle className="h-4 w-4 mr-2" />Encerrar Eleição
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Chapa */}
      {showNovaChapa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nova Chapa</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowNovaChapa(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número *</Label>
                  <Input
                    type="number"
                    value={novaChapa.numero}
                    onChange={(e) => setNovaChapa({ ...novaChapa, numero: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Nome da Chapa *</Label>
                  <Input
                    value={novaChapa.nome}
                    onChange={(e) => setNovaChapa({ ...novaChapa, nome: e.target.value })}
                    placeholder="Ex: Renovação"
                  />
                </div>
              </div>
              <div>
                <Label>Presidente *</Label>
                <Input
                  value={novaChapa.presidente}
                  onChange={(e) => setNovaChapa({ ...novaChapa, presidente: e.target.value })}
                  placeholder="Nome do candidato a presidente"
                />
              </div>
              <div>
                <Label>Vice-Presidente</Label>
                <Input
                  value={novaChapa.vice_presidente}
                  onChange={(e) => setNovaChapa({ ...novaChapa, vice_presidente: e.target.value })}
                  placeholder="Nome do candidato a vice"
                />
              </div>
              <div>
                <Label>Secretário</Label>
                <Input
                  value={novaChapa.secretario}
                  onChange={(e) => setNovaChapa({ ...novaChapa, secretario: e.target.value })}
                  placeholder="Nome do candidato a secretário"
                />
              </div>
              <div>
                <Label>Tesoureiro</Label>
                <Input
                  value={novaChapa.tesoureiro}
                  onChange={(e) => setNovaChapa({ ...novaChapa, tesoureiro: e.target.value })}
                  placeholder="Nome do candidato a tesoureiro"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNovaChapa(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={criarChapa} className="flex-1">
                  Cadastrar Chapa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
