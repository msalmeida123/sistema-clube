'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Vote, Search, CheckCircle, User } from 'lucide-react'
import Link from 'next/link'

type Chapa = {
  id: string
  numero: number
  nome: string
  presidente: string
  vice_presidente: string
}

type Associado = {
  id: string
  nome: string
  cpf: string
  numero_titulo: string
  foto_url: string
}

export default function VotarPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [eleicao, setEleicao] = useState<any>(null)
  const [chapas, setChapas] = useState<Chapa[]>([])
  const [loading, setLoading] = useState(true)
  const [buscaAssociado, setBuscaAssociado] = useState('')
  const [associados, setAssociados] = useState<Associado[]>([])
  const [associadoSelecionado, setAssociadoSelecionado] = useState<Associado | null>(null)
  const [chapaSelecionada, setChapaSelecionada] = useState<Chapa | null>(null)
  const [jaVotou, setJaVotou] = useState(false)
  const [votando, setVotando] = useState(false)
  const [votoConfirmado, setVotoConfirmado] = useState(false)

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

  const buscarAssociados = async () => {
    if (buscaAssociado.length < 2) return

    const { data } = await supabase
      .from('associados')
      .select('id, nome, cpf, numero_titulo, foto_url')
      .or(`nome.ilike.%${buscaAssociado}%,cpf.ilike.%${buscaAssociado}%,numero_titulo.ilike.%${buscaAssociado}%`)
      .eq('status', 'ativo')
      .limit(10)

    setAssociados(data || [])
  }

  const selecionarAssociado = async (associado: Associado) => {
    setAssociadoSelecionado(associado)
    setAssociados([])
    setBuscaAssociado('')

    // Verificar se já votou
    const { data: votoExistente } = await supabase
      .from('votos')
      .select('id')
      .eq('eleicao_id', id)
      .eq('associado_id', associado.id)
      .single()

    setJaVotou(!!votoExistente)
  }

  const confirmarVoto = async () => {
    if (!associadoSelecionado || !chapaSelecionada) {
      toast.error('Selecione uma chapa para votar')
      return
    }

    if (jaVotou) {
      toast.error('Este associado já votou nesta eleição')
      return
    }

    setVotando(true)

    try {
      // Registrar voto
      const { error: votoError } = await supabase.from('votos').insert({
        eleicao_id: id,
        associado_id: associadoSelecionado.id,
        chapa_id: chapaSelecionada.id,
      })

      if (votoError) throw votoError

      // Incrementar votos da chapa
      const { error: updateError } = await supabase.rpc('incrementar_voto', {
        chapa_id_param: chapaSelecionada.id
      })

      // Se a função RPC não existir, faz update manual
      if (updateError) {
        await supabase
          .from('chapas')
          .update({ votos: chapaSelecionada.votos ? chapaSelecionada.votos + 1 : 1 })
          .eq('id', chapaSelecionada.id)
      }

      setVotoConfirmado(true)
      toast.success('Voto registrado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao registrar voto: ' + error.message)
    } finally {
      setVotando(false)
    }
  }

  const novoVoto = () => {
    setAssociadoSelecionado(null)
    setChapaSelecionada(null)
    setJaVotou(false)
    setVotoConfirmado(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  // Tela de confirmação do voto
  if (votoConfirmado) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Voto Registrado!</h2>
            <p className="text-green-700 mb-4">
              O voto de <strong>{associadoSelecionado?.nome}</strong> foi computado com sucesso.
            </p>
            <p className="text-green-600">
              Chapa votada: <strong>{chapaSelecionada?.numero} - {chapaSelecionada?.nome}</strong>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={novoVoto} className="flex-1">
            <Vote className="h-4 w-4 mr-2" />Registrar Outro Voto
          </Button>
          <Link href={`/dashboard/eleicoes/${id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Voltar para Eleição
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/eleicoes/${id}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Voto</h1>
          <p className="text-muted-foreground">{eleicao?.titulo}</p>
        </div>
      </div>

      {/* Passo 1: Identificar Associado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
            Identificar Associado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!associadoSelecionado ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou título..."
                    className="pl-10"
                    value={buscaAssociado}
                    onChange={(e) => setBuscaAssociado(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && buscarAssociados()}
                  />
                </div>
                <Button onClick={buscarAssociados}>Buscar</Button>
              </div>

              {associados.length > 0 && (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {associados.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                      onClick={() => selecionarAssociado(a)}
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {a.foto_url ? (
                          <img src={a.foto_url} alt={a.nome} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{a.nome}</p>
                        <p className="text-sm text-muted-foreground">Título: {a.numero_titulo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {associadoSelecionado.foto_url ? (
                    <img src={associadoSelecionado.foto_url} alt={associadoSelecionado.nome} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">{associadoSelecionado.nome}</p>
                  <p className="text-sm text-muted-foreground">Título: {associadoSelecionado.numero_titulo}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setAssociadoSelecionado(null)}>
                Trocar
              </Button>
            </div>
          )}

          {jaVotou && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ Este associado já votou nesta eleição!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passo 2: Escolher Chapa */}
      {associadoSelecionado && !jaVotou && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              Escolher Chapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {chapas.map((chapa) => (
                <div
                  key={chapa.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    chapaSelecionada?.id === chapa.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setChapaSelecionada(chapa)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      {chapa.numero}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{chapa.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Presidente: {chapa.presidente}
                        {chapa.vice_presidente && ` | Vice: ${chapa.vice_presidente}`}
                      </p>
                    </div>
                    {chapaSelecionada?.id === chapa.id && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passo 3: Confirmar */}
      {associadoSelecionado && chapaSelecionada && !jaVotou && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              Confirmar Voto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-center">
                <strong>{associadoSelecionado.nome}</strong> está votando na chapa:
              </p>
              <p className="text-center text-2xl font-bold mt-2">
                {chapaSelecionada.numero} - {chapaSelecionada.nome}
              </p>
            </div>
            <Button
              className="w-full h-12 text-lg"
              onClick={confirmarVoto}
              disabled={votando}
            >
              <Vote className="h-5 w-5 mr-2" />
              {votando ? 'Registrando...' : 'CONFIRMAR VOTO'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
