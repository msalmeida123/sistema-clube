'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, AlertTriangle, User, MapPin, Calendar, FileText, Gavel, Printer, Download, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const ARTIGOS_LABELS: Record<string, string> = {
  'art_25_a': 'Art. 25a - Descumprir disposições do Estatuto',
  'art_25_c': 'Art. 25c - Não pagar pontualmente mensalidades',
  'art_25_e': 'Art. 25e - Não portar-se com correção',
  'art_25_f': 'Art. 25f - Manifestação política/religiosa na sede',
  'art_25_g': 'Art. 25g - Desrespeitar determinações da Diretoria',
  'art_25_i': 'Art. 25i - Desacatar membros da diretoria/empregados',
  'art_25_m': 'Art. 25m - Causar prejuízos ao patrimônio',
  'art_31_a': 'Art. 31a - Perturbar a ordem em festas/reuniões',
  'art_31_b': 'Art. 31b - Tirar proveito de enganos/exibir recibos alheios',
  'art_31_c': 'Art. 31c - Atentar contra o bom nome da entidade',
  'art_31_d': 'Art. 31d - Reincidir em desobediência às decisões',
  'art_31_e': 'Art. 31e - Ceder documento de identidade social',
  'art_31_f': 'Art. 31f - Desrespeitar/injuriar pessoas na sede',
  'art_33_a': 'Art. 33a - Atraso de mensalidades por 3 meses',
  'art_33_b': 'Art. 33b - Não satisfazer compromissos com a entidade',
  'art_33_c': 'Art. 33c - Admissão por informações falsas',
  'art_33_d': 'Art. 33d - Reincidir em atentados ao bom nome',
  'art_33_e': 'Art. 33e - Caluniar membros dos poderes diretivos',
  'art_33_f': 'Art. 33f - Provocar conflitos/agressões',
  'art_33_g': 'Art. 33g - Criar dissensões entre associados',
  'art_33_h': 'Art. 33h - Promover retirada de associados',
  'art_33_i': 'Art. 33i - Reincidir em suspensões máximas',
  'art_33_j': 'Art. 33j - Publicidade negativa da sociedade',
  'art_33_k': 'Art. 33k - Praticar atos desabonadores',
  'art_34_a': 'Art. 34a - Condenação judicial por causa desonrosa',
  'art_34_b': 'Art. 34b - Apropriação de valores da entidade',
  'art_34_c': 'Art. 34c - Atos atentatórios à moral e bons costumes',
}

export default function InfracaoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const documentoRef = useRef<HTMLDivElement>(null)
  
  const [infracao, setInfracao] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  const [decisao, setDecisao] = useState({
    penalidade_aplicada: '',
    dias_suspensao: '',
    parecer_diretoria: '',
  })

  useEffect(() => {
    async function fetchInfracao() {
      const { data } = await supabase
        .from('infracoes')
        .select('*, associado:associados(*)')
        .eq('id', params.id)
        .single()
      
      setInfracao(data)
      if (data?.penalidade_aplicada) {
        setDecisao({
          penalidade_aplicada: data.penalidade_aplicada,
          dias_suspensao: data.dias_suspensao?.toString() || '',
          parecer_diretoria: data.parecer_diretoria || '',
        })
      }
      setLoading(false)
    }
    if (params.id) fetchInfracao()
  }, [params.id, supabase])

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')
  const formatarDataHora = (data: string) => new Date(data).toLocaleString('pt-BR')

  const iniciarAnalise = async () => {
    setSalvando(true)
    const { error } = await supabase
      .from('infracoes')
      .update({ status: 'em_analise' })
      .eq('id', params.id)
    
    if (!error) {
      setInfracao({ ...infracao, status: 'em_analise' })
      toast.success('Análise iniciada')
    }
    setSalvando(false)
  }

  const salvarDecisao = async () => {
    if (!decisao.penalidade_aplicada || !decisao.parecer_diretoria) {
      toast.error('Preencha a penalidade e o parecer')
      return
    }
    if (decisao.penalidade_aplicada === 'suspensao' && !decisao.dias_suspensao) {
      toast.error('Informe o número de dias de suspensão')
      return
    }

    setSalvando(true)
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('infracoes')
      .update({
        status: 'julgado',
        penalidade_aplicada: decisao.penalidade_aplicada,
        dias_suspensao: decisao.penalidade_aplicada === 'suspensao' ? parseInt(decisao.dias_suspensao) : null,
        parecer_diretoria: decisao.parecer_diretoria,
        analisado_por: userData.user?.id,
        data_analise: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      toast.error('Erro ao salvar decisão')
    } else {
      toast.success('Decisão registrada com sucesso!')
      router.refresh()
      // Atualizar status do associado se for eliminação ou expulsão
      if (['eliminacao', 'expulsao'].includes(decisao.penalidade_aplicada)) {
        await supabase
          .from('associados')
          .update({ status: decisao.penalidade_aplicada === 'expulsao' ? 'expulso' : 'inativo' })
          .eq('id', infracao.associado_id)
      } else if (decisao.penalidade_aplicada === 'suspensao') {
        await supabase
          .from('associados')
          .update({ status: 'suspenso' })
          .eq('id', infracao.associado_id)
      }
      setInfracao({ ...infracao, status: 'julgado', ...decisao })
    }
    setSalvando(false)
  }

  const arquivar = async () => {
    setSalvando(true)
    const { error } = await supabase
      .from('infracoes')
      .update({ status: 'arquivado' })
      .eq('id', params.id)
    
    if (!error) {
      setInfracao({ ...infracao, status: 'arquivado' })
      toast.success('Ocorrência arquivada')
    }
    setSalvando(false)
  }

  const imprimir = () => window.print()

  const gerarPDF = async () => {
    if (!documentoRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default
    
    const canvas = await html2canvas(documentoRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const ratio = pdfWidth / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, canvas.height * ratio)
    pdf.save(`infracao_${infracao?.associado?.nome?.replace(/\s+/g, '_')}.pdf`)
  }

  const gravidadeLabels: Record<string, string> = {
    leve: 'Leve', media: 'Média', grave: 'Grave', gravissima: 'Gravíssima'
  }
  const gravidadeColors: Record<string, string> = {
    leve: 'bg-blue-100 text-blue-800', media: 'bg-yellow-100 text-yellow-800',
    grave: 'bg-orange-100 text-orange-800', gravissima: 'bg-red-100 text-red-800'
  }
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente', em_analise: 'Em Análise', julgado: 'Julgado', arquivado: 'Arquivado'
  }
  const penalidadeLabels: Record<string, string> = {
    absolvido: 'Absolvido', admoestacao: 'Admoestação', suspensao: 'Suspensão',
    eliminacao: 'Eliminação', expulsao: 'Expulsão'
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p>Carregando...</p></div>
  if (!infracao) return <div className="flex flex-col items-center justify-center h-64 gap-4"><p>Ocorrência não encontrada</p><Button onClick={() => router.back()}>Voltar</Button></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ocorrência Disciplinar</h1>
            <p className="text-muted-foreground">Análise e parecer da Diretoria</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={imprimir}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
          <Button variant="outline" onClick={gerarPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
        </div>
      </div>

      <div ref={documentoRef} className="space-y-6">
        {/* Documento de Ocorrência */}
        <Card className="print:shadow-none">
          <CardContent className="p-8">
            {/* Cabeçalho do documento */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase">ASSOCIAÇÃO DOS EMPREGADOS NO COMÉRCIO DE FRANCA</h1>
              <p className="text-sm text-gray-600">CNPJ: 47.987.136/0001-09 | Av. Miguel Sábio de Mello, 351 - Franca/SP</p>
              <h2 className="text-lg font-bold mt-4 uppercase">RELATÓRIO DE OCORRÊNCIA DISCIPLINAR</h2>
              <p className="text-sm">Protocolo: {infracao.id.slice(0, 8).toUpperCase()}</p>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  infracao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                  infracao.status === 'em_analise' ? 'bg-orange-100 text-orange-800' :
                  infracao.status === 'julgado' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[infracao.status]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Gravidade:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${gravidadeColors[infracao.gravidade_sugerida]}`}>
                  {gravidadeLabels[infracao.gravidade_sugerida]}
                </span>
              </div>
            </div>

            {/* Dados do Associado */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5" /> IDENTIFICAÇÃO DO ASSOCIADO
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div><span className="font-semibold">Nome:</span> {infracao.associado?.nome}</div>
                <div><span className="font-semibold">Título:</span> {infracao.associado?.numero_titulo}</div>
                <div><span className="font-semibold">CPF:</span> {infracao.associado?.cpf}</div>
                <div><span className="font-semibold">Plano:</span> {infracao.associado?.plano}</div>
              </div>
            </div>

            {/* Dados da Ocorrência */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" /> DADOS DA OCORRÊNCIA
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div><span className="font-semibold">Data/Hora:</span> {formatarDataHora(infracao.data_ocorrencia)}</div>
                <div><span className="font-semibold">Local:</span> {infracao.local_ocorrencia}</div>
                <div><span className="font-semibold">Registrado em:</span> {formatarData(infracao.data_registro)}</div>
              </div>
            </div>

            {/* Descrição do Fato */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" /> DESCRIÇÃO DOS FATOS
              </h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="whitespace-pre-wrap">{infracao.descricao_fato}</p>
              </div>
            </div>

            {/* Testemunhas */}
            {(infracao.testemunha1_nome || infracao.testemunha2_nome) && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">TESTEMUNHAS</h3>
                <div className="grid grid-cols-2 gap-4">
                  {infracao.testemunha1_nome && (
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">{infracao.testemunha1_nome}</p>
                      <p className="text-sm text-muted-foreground">{infracao.testemunha1_contato}</p>
                    </div>
                  )}
                  {infracao.testemunha2_nome && (
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">{infracao.testemunha2_nome}</p>
                      <p className="text-sm text-muted-foreground">{infracao.testemunha2_contato}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Artigos Infringidos */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" /> ARTIGOS DO ESTATUTO INFRINGIDOS
              </h3>
              <div className="space-y-2">
                {infracao.artigos_infringidos?.map((art: string) => (
                  <div key={art} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    {ARTIGOS_LABELS[art] || art}
                  </div>
                ))}
              </div>
            </div>

            {/* Decisão (se já julgado) */}
            {infracao.status === 'julgado' && infracao.penalidade_aplicada && (
              <div className="mb-6 p-6 bg-gray-100 border-2 border-gray-300 rounded-lg">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Gavel className="h-5 w-5" /> DECISÃO DA DIRETORIA
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Penalidade Aplicada:</span>
                    <span className={`px-4 py-2 rounded-full font-bold ${
                      infracao.penalidade_aplicada === 'absolvido' ? 'bg-green-200 text-green-800' :
                      infracao.penalidade_aplicada === 'admoestacao' ? 'bg-blue-200 text-blue-800' :
                      infracao.penalidade_aplicada === 'suspensao' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {penalidadeLabels[infracao.penalidade_aplicada]}
                      {infracao.dias_suspensao && ` - ${infracao.dias_suspensao} dias`}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Data do Julgamento:</span> {formatarData(infracao.data_analise)}
                  </div>
                  <div>
                    <span className="font-semibold">Parecer:</span>
                    <p className="mt-2 p-3 bg-white rounded border">{infracao.parecer_diretoria}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Decisão (apenas se não julgado) */}
        {infracao.status !== 'julgado' && infracao.status !== 'arquivado' && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" /> Decisão da Diretoria
              </CardTitle>
              <CardDescription>
                Conforme Art. 29 do Estatuto, cabe à Diretoria o julgamento e aplicação das penalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {infracao.status === 'pendente' && (
                <div className="flex gap-4">
                  <Button onClick={iniciarAnalise} disabled={salvando} className="flex-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Iniciar Análise
                  </Button>
                  <Button variant="outline" onClick={arquivar} disabled={salvando}>
                    Arquivar
                  </Button>
                </div>
              )}

              {infracao.status === 'em_analise' && (
                <>
                  <div>
                    <Label className="text-base font-semibold">Penalidade a ser Aplicada *</Label>
                    <div className="grid grid-cols-5 gap-3 mt-2">
                      {[
                        { valor: 'absolvido', label: 'Absolvido', cor: 'border-green-500 bg-green-50' },
                        { valor: 'admoestacao', label: 'Admoestação', cor: 'border-blue-500 bg-blue-50' },
                        { valor: 'suspensao', label: 'Suspensão', cor: 'border-yellow-500 bg-yellow-50' },
                        { valor: 'eliminacao', label: 'Eliminação', cor: 'border-orange-500 bg-orange-50' },
                        { valor: 'expulsao', label: 'Expulsão', cor: 'border-red-500 bg-red-50' },
                      ].map((p) => (
                        <label
                          key={p.valor}
                          className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                            decisao.penalidade_aplicada === p.valor ? p.cor + ' ring-2' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="penalidade"
                            value={p.valor}
                            checked={decisao.penalidade_aplicada === p.valor}
                            onChange={(e) => setDecisao({ ...decisao, penalidade_aplicada: e.target.value })}
                            className="sr-only"
                          />
                          <p className="font-medium text-sm">{p.label}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  {decisao.penalidade_aplicada === 'suspensao' && (
                    <div>
                      <Label>Dias de Suspensão (máx. 119 dias conforme Art. 31)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="119"
                        value={decisao.dias_suspensao}
                        onChange={(e) => setDecisao({ ...decisao, dias_suspensao: e.target.value })}
                        placeholder="Número de dias"
                        className="w-48"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-base font-semibold">Parecer da Diretoria *</Label>
                    <Textarea
                      value={decisao.parecer_diretoria}
                      onChange={(e) => setDecisao({ ...decisao, parecer_diretoria: e.target.value })}
                      placeholder="Fundamente a decisão conforme os artigos do Estatuto Social..."
                      rows={5}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={salvarDecisao} disabled={salvando} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {salvando ? 'Salvando...' : 'Registrar Decisão'}
                    </Button>
                    <Button variant="outline" onClick={arquivar} disabled={salvando}>
                      Arquivar
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * Conforme Art. 39, o associado terá direito de recurso ao Conselho Deliberativo no prazo de 15 dias 
                    a contar da notificação da penalidade.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
