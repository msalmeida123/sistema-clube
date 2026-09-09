'use client'

import { buscarPessoasClube } from '@/lib/busca-pessoas-clube'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
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
  const [supabase] = useState(() => createClientComponentClient())
  const [modoBusca, setModoBusca] = useState<'qr' | 'cadastro'>('qr')
  const [buscando, setBuscando] = useState(false)
  const buscaEmAndamento = useRef(false)
  const [erroBusca, setErroBusca] = useState('')
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
    const valor = buscaAssociado.trim()
    if (!valor || buscaEmAndamento.current) return
    buscaEmAndamento.current = true
    setBuscando(true)
    setAssociados([])
    setErroBusca('')
    try {
      if (modoBusca === 'qr') {
        const pessoas = await buscarPessoasClube(supabase, valor)
        const ativos=pessoas.filter(p=>p.status==='ativo')
        if(ativos.length>1) {setAssociados(ativos);return}
        const pessoa = ativos[0] ?? pessoas[0]
        if (!pessoa) { setErroBusca('Carteirinha de associado não encontrada. Use o QR da carteirinha atual.'); return }
        if (pessoa.status !== 'ativo') { setErroBusca('Este associado não está ativo. Verifique o cadastro.'); return }
        selecionarAssociado(pessoa)
        return
      }
      if (valor.length < 2) { setErroBusca('Digite pelo menos dois caracteres.'); return }
      let consulta = supabase.from('associados').select('id,nome,cpf,numero_titulo,foto_url').eq('status','ativo')
      const cpf = valor.replace(/[.\-\s]/g,'')
      consulta = /^\d{11}$/.test(cpf) ? consulta.eq('cpf',cpf) : consulta.ilike('nome','%'+valor.replace(/[%_]/g,'')+'%')
      const {data,error} = await consulta.limit(10)
      if (error) throw error
      setAssociados(data || [])
      if (!data?.length) setErroBusca('Nenhum associado encontrado.')
    } catch {
      setErroBusca('Não foi possível consultar. Verifique sua conexão e permissão e tente novamente.')
    } finally { buscaEmAndamento.current = false; setBuscando(false) }
  }

  const selecionarAssociado = (a: any) => {
    setErroBusca('')
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

    if (buscaEmAndamento.current || loading) return
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
                <div>
                  <Label htmlFor="modo-busca">Consultar associado por</Label>
                  <select id="modo-busca" className="w-full h-10 border rounded-md px-3" value={modoBusca} disabled={buscando}
                    onChange={e=>{setModoBusca(e.target.value as 'qr' | 'cadastro');setBuscaAssociado('');setAssociados([]);setErroBusca('')}}>
                    <option value="qr">QR Code ou número do título</option>
                    <option value="cadastro">Nome ou CPF</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      aria-label="Buscar associado"
                      autoFocus
                      disabled={buscando}
                      placeholder={modoBusca === 'qr' ? 'Escaneie o QR Code ou digite o título...' : 'Buscar por nome ou CPF...'}
                      className="pl-10"
                      value={buscaAssociado}
                      onChange={(e) => setBuscaAssociado(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); buscarAssociados() } }}
                    />
                  </div>
                  <Button type="button" disabled={buscando} onClick={buscarAssociados}>{buscando ? 'Buscando...' : 'Buscar'}</Button>
                </div>

                <p className="text-sm text-muted-foreground">Leia com o scanner USB e pressione Enter, se necessário. A consulta apenas seleciona o associado.</p>
                {erroBusca && <p role="alert" className="text-sm text-red-600">{erroBusca}</p>}
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
          <Button type="submit" disabled={loading || buscando} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Exame'}
          </Button>
        </div>
      </form>
    </div>
  )
}
