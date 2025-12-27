'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Search, AlertTriangle, Save } from 'lucide-react'
import { toast } from 'sonner'

const ARTIGOS_ESTATUTO = [
  { valor: 'art_25_a', label: 'Art. 25a - Descumprir disposições do Estatuto' },
  { valor: 'art_25_c', label: 'Art. 25c - Não pagar pontualmente mensalidades' },
  { valor: 'art_25_e', label: 'Art. 25e - Não portar-se com correção' },
  { valor: 'art_25_f', label: 'Art. 25f - Manifestação política/religiosa na sede' },
  { valor: 'art_25_g', label: 'Art. 25g - Desrespeitar determinações da Diretoria' },
  { valor: 'art_25_i', label: 'Art. 25i - Desacatar membros da diretoria/empregados' },
  { valor: 'art_25_m', label: 'Art. 25m - Causar prejuízos ao patrimônio' },
  { valor: 'art_31_a', label: 'Art. 31a - Perturbar a ordem em festas/reuniões' },
  { valor: 'art_31_b', label: 'Art. 31b - Tirar proveito de enganos/exibir recibos alheios' },
  { valor: 'art_31_c', label: 'Art. 31c - Atentar contra o bom nome da entidade' },
  { valor: 'art_31_d', label: 'Art. 31d - Reincidir em desobediência às decisões' },
  { valor: 'art_31_e', label: 'Art. 31e - Ceder documento de identidade social' },
  { valor: 'art_31_f', label: 'Art. 31f - Desrespeitar/injuriar pessoas na sede' },
  { valor: 'art_33_a', label: 'Art. 33a - Atraso de mensalidades por 3 meses' },
  { valor: 'art_33_b', label: 'Art. 33b - Não satisfazer compromissos com a entidade' },
  { valor: 'art_33_c', label: 'Art. 33c - Admissão por informações falsas' },
  { valor: 'art_33_d', label: 'Art. 33d - Reincidir em atentados ao bom nome' },
  { valor: 'art_33_e', label: 'Art. 33e - Caluniar membros dos poderes diretivos' },
  { valor: 'art_33_f', label: 'Art. 33f - Provocar conflitos/agressões' },
  { valor: 'art_33_g', label: 'Art. 33g - Criar dissensões entre associados' },
  { valor: 'art_33_h', label: 'Art. 33h - Promover retirada de associados' },
  { valor: 'art_33_i', label: 'Art. 33i - Reincidir em suspensões máximas' },
  { valor: 'art_33_j', label: 'Art. 33j - Publicidade negativa da sociedade' },
  { valor: 'art_33_k', label: 'Art. 33k - Praticar atos desabonadores' },
  { valor: 'art_34_a', label: 'Art. 34a - Condenação judicial por causa desonrosa' },
  { valor: 'art_34_b', label: 'Art. 34b - Apropriação de valores da entidade' },
  { valor: 'art_34_c', label: 'Art. 34c - Atos atentatórios à moral e bons costumes' },
]

const LOCAIS = [
  'Sede Social - Salão Principal',
  'Sede Social - Restaurante',
  'Sede Social - Bar',
  'Sede Social - Recepção',
  'Sede Campestre - Piscina',
  'Sede Campestre - Churrasqueiras',
  'Sede Campestre - Campo de Futebol',
  'Sede Campestre - Quadras',
  'Sede Campestre - Playground',
  'Sede Campestre - Salão de Festas',
  'Academia',
  'Estacionamento',
  'Outro',
]

export default function NovaInfracaoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(false)
  const [buscaAssociado, setBuscaAssociado] = useState('')
  const [associados, setAssociados] = useState<any[]>([])
  const [showResultados, setShowResultados] = useState(false)
  
  const [form, setForm] = useState({
    associado_id: '',
    associado_nome: '',
    associado_titulo: '',
    data_ocorrencia: '',
    hora_ocorrencia: '',
    local_ocorrencia: '',
    local_outro: '',
    descricao_fato: '',
    testemunha1_nome: '',
    testemunha1_contato: '',
    testemunha2_nome: '',
    testemunha2_contato: '',
    artigos_infringidos: [] as string[],
    gravidade_sugerida: '',
  })

  const buscarAssociado = async () => {
    if (buscaAssociado.length < 2) return
    
    const { data } = await supabase
      .from('associados')
      .select('id, nome, cpf, numero_titulo, status')
      .or(`nome.ilike.%${buscaAssociado}%,cpf.ilike.%${buscaAssociado}%,numero_titulo.eq.${parseInt(buscaAssociado) || 0}`)
      .eq('status', 'ativo')
      .limit(10)
    
    setAssociados(data || [])
    setShowResultados(true)
  }

  const selecionarAssociado = (assoc: any) => {
    setForm({
      ...form,
      associado_id: assoc.id,
      associado_nome: assoc.nome,
      associado_titulo: assoc.numero_titulo,
    })
    setBuscaAssociado(assoc.nome)
    setShowResultados(false)
  }

  const toggleArtigo = (artigo: string) => {
    setForm(prev => ({
      ...prev,
      artigos_infringidos: prev.artigos_infringidos.includes(artigo)
        ? prev.artigos_infringidos.filter(a => a !== artigo)
        : [...prev.artigos_infringidos, artigo]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.associado_id) {
      toast.error('Selecione um associado')
      return
    }
    if (!form.data_ocorrencia || !form.descricao_fato || !form.gravidade_sugerida) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (form.artigos_infringidos.length === 0) {
      toast.error('Selecione pelo menos um artigo infringido')
      return
    }

    setLoading(true)

    const dataHora = form.hora_ocorrencia 
      ? `${form.data_ocorrencia}T${form.hora_ocorrencia}:00`
      : `${form.data_ocorrencia}T00:00:00`

    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('infracoes').insert({
      associado_id: form.associado_id,
      data_ocorrencia: dataHora,
      local_ocorrencia: form.local_ocorrencia === 'Outro' ? form.local_outro : form.local_ocorrencia,
      descricao_fato: form.descricao_fato,
      testemunha1_nome: form.testemunha1_nome || null,
      testemunha1_contato: form.testemunha1_contato || null,
      testemunha2_nome: form.testemunha2_nome || null,
      testemunha2_contato: form.testemunha2_contato || null,
      artigos_infringidos: form.artigos_infringidos,
      gravidade_sugerida: form.gravidade_sugerida,
      registrado_por: userData.user?.id,
      status: 'pendente',
    })

    setLoading(false)

    if (error) {
      toast.error('Erro ao registrar ocorrência: ' + error.message)
    } else {
      toast.success('Ocorrência registrada com sucesso!')
      router.push('/dashboard/infracoes')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Registrar Ocorrência</h1>
          <p className="text-muted-foreground">Preencha os dados da infração cometida pelo associado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Busca do Associado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Identificação do Associado Infrator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label>Buscar Associado *</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    placeholder="Digite nome, CPF ou número do título..."
                    value={buscaAssociado}
                    onChange={(e) => setBuscaAssociado(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarAssociado())}
                  />
                  {showResultados && associados.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {associados.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                          onClick={() => selecionarAssociado(a)}
                        >
                          <p className="font-medium">{a.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Título: {a.numero_titulo} | CPF: {a.cpf}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={buscarAssociado}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {form.associado_id && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800">{form.associado_nome}</p>
                <p className="text-sm text-red-600">Título nº {form.associado_titulo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados da Ocorrência */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Ocorrência</CardTitle>
            <CardDescription>Informações sobre quando e onde aconteceu o fato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data da Ocorrência *</Label>
                <Input
                  type="date"
                  value={form.data_ocorrencia}
                  onChange={(e) => setForm({ ...form, data_ocorrencia: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label>Hora (aproximada)</Label>
                <Input
                  type="time"
                  value={form.hora_ocorrencia}
                  onChange={(e) => setForm({ ...form, hora_ocorrencia: e.target.value })}
                />
              </div>
              <div>
                <Label>Local *</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={form.local_ocorrencia}
                  onChange={(e) => setForm({ ...form, local_ocorrencia: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {LOCAIS.map((local) => (
                    <option key={local} value={local}>{local}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.local_ocorrencia === 'Outro' && (
              <div>
                <Label>Especifique o local</Label>
                <Input
                  value={form.local_outro}
                  onChange={(e) => setForm({ ...form, local_outro: e.target.value })}
                  placeholder="Descreva o local da ocorrência"
                />
              </div>
            )}

            <div>
              <Label>Descrição Detalhada do Fato *</Label>
              <Textarea
                value={form.descricao_fato}
                onChange={(e) => setForm({ ...form, descricao_fato: e.target.value })}
                placeholder="Descreva detalhadamente o que aconteceu, incluindo circunstâncias, envolvidos e consequências..."
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Testemunhas */}
        <Card>
          <CardHeader>
            <CardTitle>Testemunhas</CardTitle>
            <CardDescription>Pessoas que presenciaram o fato (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da Testemunha 1</Label>
                <Input
                  value={form.testemunha1_nome}
                  onChange={(e) => setForm({ ...form, testemunha1_nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Contato da Testemunha 1</Label>
                <Input
                  value={form.testemunha1_contato}
                  onChange={(e) => setForm({ ...form, testemunha1_contato: e.target.value })}
                  placeholder="Telefone ou e-mail"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da Testemunha 2</Label>
                <Input
                  value={form.testemunha2_nome}
                  onChange={(e) => setForm({ ...form, testemunha2_nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Contato da Testemunha 2</Label>
                <Input
                  value={form.testemunha2_contato}
                  onChange={(e) => setForm({ ...form, testemunha2_contato: e.target.value })}
                  placeholder="Telefone ou e-mail"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artigos Infringidos */}
        <Card>
          <CardHeader>
            <CardTitle>Artigos do Estatuto Infringidos *</CardTitle>
            <CardDescription>Selecione os artigos que foram violados pelo associado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {ARTIGOS_ESTATUTO.map((artigo) => (
                <label
                  key={artigo.valor}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    form.artigos_infringidos.includes(artigo.valor)
                      ? 'bg-red-50 border-red-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.artigos_infringidos.includes(artigo.valor)}
                    onChange={() => toggleArtigo(artigo.valor)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{artigo.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gravidade Sugerida */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação da Gravidade *</CardTitle>
            <CardDescription>Sugestão da Secretaria para análise da Diretoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { valor: 'leve', label: 'Leve', desc: 'Admoestação', cor: 'border-blue-300 bg-blue-50' },
                { valor: 'media', label: 'Média', desc: 'Suspensão até 30 dias', cor: 'border-yellow-300 bg-yellow-50' },
                { valor: 'grave', label: 'Grave', desc: 'Suspensão 30-119 dias', cor: 'border-orange-300 bg-orange-50' },
                { valor: 'gravissima', label: 'Gravíssima', desc: 'Eliminação/Expulsão', cor: 'border-red-300 bg-red-50' },
              ].map((g) => (
                <label
                  key={g.valor}
                  className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${
                    form.gravidade_sugerida === g.valor
                      ? g.cor + ' ring-2 ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="gravidade"
                    value={g.valor}
                    checked={form.gravidade_sugerida === g.valor}
                    onChange={(e) => setForm({ ...form, gravidade_sugerida: e.target.value })}
                    className="sr-only"
                  />
                  <p className="font-bold">{g.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Registrando...' : 'Registrar Ocorrência'}
          </Button>
        </div>
      </form>
    </div>
  )
}
