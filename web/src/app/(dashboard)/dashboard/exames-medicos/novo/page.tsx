'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Search, Stethoscope, Upload } from 'lucide-react'
import Link from 'next/link'

export default function NovoExameMedicoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [buscaAssociado, setBuscaAssociado] = useState('')
  const [associados, setAssociados] = useState<any[]>([])
  const [associadoSelecionado, setAssociadoSelecionado] = useState<any>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)

  const [form, setForm] = useState({
    data_exame: '',
    data_validade: '',
    medico_nome: '',
    crm: '',
    tipo_exame: 'piscina',
    resultado: 'apto',
    observacoes: '',
  })

  const buscarAssociados = async () => {
    if (buscaAssociado.length < 2) return

    const { data } = await supabase
      .from('associados')
      .select('id, nome, cpf, numero_titulo, foto_url')
      .or(`nome.ilike.%${buscaAssociado}%,cpf.ilike.%${buscaAssociado}%`)
      .eq('status', 'ativo')
      .limit(10)

    setAssociados(data || [])
  }

  const selecionarAssociado = (a: any) => {
    setAssociadoSelecionado(a)
    setAssociados([])
    setBuscaAssociado('')
  }

  const calcularValidade = (dataExame: string) => {
    if (!dataExame) return ''
    const data = new Date(dataExame)
    data.setFullYear(data.getFullYear() + 1) // 1 ano de validade
    return data.toISOString().split('T')[0]
  }

  const handleDataExameChange = (value: string) => {
    setForm({
      ...form,
      data_exame: value,
      data_validade: calcularValidade(value),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!associadoSelecionado) {
      toast.error('Selecione um associado')
      return
    }

    if (!form.data_exame || !form.data_validade || !form.medico_nome || !form.crm) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      let arquivo_url = null

      // Upload do arquivo se existir
      if (arquivo) {
        const ext = arquivo.name.split('.').pop()
        const fileName = `${associadoSelecionado.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('exames-medicos')
          .upload(fileName, arquivo)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('exames-medicos')
          .getPublicUrl(fileName)

        arquivo_url = urlData.publicUrl
      }

      const { error } = await supabase.from('exames_medicos').insert({
        associado_id: associadoSelecionado.id,
        data_exame: form.data_exame,
        data_validade: form.data_validade,
        medico_nome: form.medico_nome,
        crm: form.crm,
        tipo_exame: form.tipo_exame,
        resultado: form.resultado,
        observacoes: form.observacoes,
        arquivo_url,
      })

      if (error) throw error

      toast.success('Exame médico registrado com sucesso!')
      router.push('/dashboard/exames-medicos')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/exames-medicos">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          Registrar Exame Médico
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Busca de Associado */}
        <Card>
          <CardHeader>
            <CardTitle>Associado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!associadoSelecionado ? (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      className="pl-10"
                      value={buscaAssociado}
                      onChange={(e) => setBuscaAssociado(e.target.value)}
                      onKeyUp={(e) => e.key === 'Enter' && buscarAssociados()}
                    />
                  </div>
                  <Button type="button" onClick={buscarAssociados}>Buscar</Button>
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
                            <span className="text-lg font-medium">{a.nome[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{a.nome}</p>
                          <p className="text-sm text-muted-foreground">Título: {a.numero_titulo} | CPF: {a.cpf}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {associadoSelecionado.foto_url ? (
                      <img src={associadoSelecionado.foto_url} alt={associadoSelecionado.nome} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-medium">{associadoSelecionado.nome[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{associadoSelecionado.nome}</p>
                    <p className="text-sm text-muted-foreground">Título: {associadoSelecionado.numero_titulo}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => setAssociadoSelecionado(null)}>
                  Trocar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Exame */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Exame</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Exame *</Label>
                <select
                  className="w-full h-10 border rounded-md px-3"
                  value={form.tipo_exame}
                  onChange={(e) => setForm({ ...form, tipo_exame: e.target.value })}
                >
                  <option value="piscina">Piscina (Dermatológico)</option>
                  <option value="periodico">Periódico</option>
                </select>
              </div>
              <div>
                <Label>Resultado *</Label>
                <select
                  className="w-full h-10 border rounded-md px-3"
                  value={form.resultado}
                  onChange={(e) => setForm({ ...form, resultado: e.target.value })}
                >
                  <option value="apto">Apto</option>
                  <option value="apto_restricao">Apto com Restrição</option>
                  <option value="inapto">Inapto</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data do Exame *</Label>
                <Input
                  type="date"
                  value={form.data_exame}
                  onChange={(e) => handleDataExameChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Data de Validade *</Label>
                <Input
                  type="date"
                  value={form.data_validade}
                  onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente (1 ano)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Médico Responsável */}
        <Card>
          <CardHeader>
            <CardTitle>Médico Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Médico *</Label>
                <Input
                  value={form.medico_nome}
                  onChange={(e) => setForm({ ...form, medico_nome: e.target.value })}
                  placeholder="Dr. João da Silva"
                />
              </div>
              <div>
                <Label>CRM *</Label>
                <Input
                  value={form.crm}
                  onChange={(e) => setForm({ ...form, crm: e.target.value })}
                  placeholder="12345-SP"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações e Arquivo */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações sobre o exame..."
                rows={3}
              />
            </div>

            <div>
              <Label>Anexar Atestado (PDF ou Imagem)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {arquivo ? arquivo.name : 'Clique para selecionar arquivo'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Link href="/dashboard/exames-medicos" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Exame'}
          </Button>
        </div>
      </form>
    </div>
  )
}
