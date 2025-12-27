'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Stethoscope, Upload } from 'lucide-react'
import Link from 'next/link'

export default function EditarExamePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [associado, setAssociado] = useState<any>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)

  const [form, setForm] = useState({
    data_exame: '',
    data_validade: '',
    medico_nome: '',
    crm: '',
    tipo_exame: 'piscina',
    resultado: 'apto',
    observacoes: '',
    arquivo_url: '',
  })

  useEffect(() => {
    const fetchExame = async () => {
      const { data } = await supabase
        .from('exames_medicos')
        .select('*, associado:associados(id, nome, cpf, numero_titulo, foto_url)')
        .eq('id', id)
        .single()

      if (data) {
        setForm({
          data_exame: data.data_exame,
          data_validade: data.data_validade,
          medico_nome: data.medico_nome || '',
          crm: data.crm || '',
          tipo_exame: data.tipo_exame || 'piscina',
          resultado: data.resultado || 'apto',
          observacoes: data.observacoes || '',
          arquivo_url: data.arquivo_url || '',
        })
        setAssociado(data.associado)
      }
      setLoadingData(false)
    }
    fetchExame()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.data_exame || !form.data_validade || !form.medico_nome || !form.crm) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      let arquivo_url = form.arquivo_url

      // Upload do novo arquivo se existir
      if (arquivo && associado) {
        const ext = arquivo.name.split('.').pop()
        const fileName = `${associado.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('exames-medicos')
          .upload(fileName, arquivo)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('exames-medicos')
          .getPublicUrl(fileName)

        arquivo_url = urlData.publicUrl
      }

      const { error } = await supabase
        .from('exames_medicos')
        .update({
          data_exame: form.data_exame,
          data_validade: form.data_validade,
          medico_nome: form.medico_nome,
          crm: form.crm,
          tipo_exame: form.tipo_exame,
          resultado: form.resultado,
          observacoes: form.observacoes,
          arquivo_url,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Exame atualizado com sucesso!')
      router.push(`/dashboard/exames-medicos/${id}`)
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="flex justify-center p-8">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/exames-medicos/${id}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          Editar Exame Médico
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Associado (somente leitura) */}
        {associado && (
          <Card>
            <CardHeader>
              <CardTitle>Associado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {associado.foto_url ? (
                    <img src={associado.foto_url} alt={associado.nome} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-medium">{associado.nome?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">{associado.nome}</p>
                  <p className="text-sm text-muted-foreground">Título: {associado.numero_titulo} | CPF: {associado.cpf}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  onChange={(e) => setForm({ ...form, data_exame: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de Validade *</Label>
                <Input
                  type="date"
                  value={form.data_validade}
                  onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
                />
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
              {form.arquivo_url && !arquivo && (
                <p className="text-sm text-muted-foreground mb-2">
                  Arquivo atual: <a href={form.arquivo_url} target="_blank" className="text-primary hover:underline">Ver arquivo</a>
                </p>
              )}
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {arquivo ? arquivo.name : 'Clique para substituir arquivo'}
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
          <Link href={`/dashboard/exames-medicos/${id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
