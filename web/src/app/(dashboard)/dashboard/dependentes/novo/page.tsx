'use client'

import { buscarPessoasClube } from '@/lib/busca-pessoas-clube'
import DocumentosDependente from '@/components/DocumentosDependente'
import { DOCUMENTACAO_VAZIA, validarDocumentacao, hojeBrasil, idadeDependente } from '@/lib/documentos-dependente'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Search, Upload, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Regras do Art. 20 do Estatuto
const PARENTESCOS = [
  { value: 'conjuge', label: 'Cônjuge', regra: 'Sem restrição de idade', idadeMax: null, idadeMin: null, docObrigatorio: 'Certidão de Casamento' },
  { value: 'filho', label: 'Filho(a)', regra: 'Até 21 anos; após isso, matrícula válida na faculdade', idadeMax: null, idadeMin: null, docObrigatorio: 'Certidão de Nascimento' },
  { value: 'filho_universitario', label: 'Filho(a) Universitário', regra: 'Sem limite máximo de idade, com matrícula válida na faculdade', idadeMax: null, idadeMin: null, docObrigatorio: 'Declaração de Matrícula ou Histórico Escolar' },
  { value: 'pai', label: 'Pai', regra: 'Acima de 60 anos, dependência econômica, associado solteiro', idadeMax: null, idadeMin: 60, docObrigatorio: 'Certidão de Nascimento do Titular' },
  { value: 'mae', label: 'Mãe', regra: 'Acima de 60 anos, dependência econômica, associado solteiro', idadeMax: null, idadeMin: 60, docObrigatorio: 'Certidão de Nascimento do Titular' },
  { value: 'sogra', label: 'Sogra', regra: 'Viúva e com dependência econômica', idadeMax: null, idadeMin: null, docObrigatorio: 'Certidão de Óbito do Sogro + Certidão de Casamento' },
  { value: 'enteado', label: 'Enteado(a)', regra: 'Até 21 anos; após isso, matrícula válida na faculdade', idadeMax: null, idadeMin: null, docObrigatorio: 'Certidão de Nascimento + Certidão de Casamento' },
  { value: 'adotado', label: 'Filho(a) Adotado', regra: 'Até 21 anos; após isso, matrícula válida na faculdade, com dependência', idadeMax: null, idadeMin: null, docObrigatorio: 'Termo de Adoção' },
]

export default function NovoDependentePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [buscaTitular, setBuscaTitular] = useState('')
  const [titulares, setTitulares] = useState<any[]>([])
  const [titularSelecionado, setTitularSelecionado] = useState<any>(null)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [docs, setDocs] = useState(DOCUMENTACAO_VAZIA)
  const [enviando, setEnviando] = useState(false)
  const [erroIdade, setErroIdade] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    parentesco: '',
    telefone: '',
    email: '',
  })

  const buscarTitulares = async () => {
    if (!buscaTitular.trim()) return

    try {
      const pessoas = await buscarPessoasClube(supabase,buscaTitular)
      setTitulares(pessoas.filter(p=>p.status==='ativo' && ['familiar','patrimonial'].includes(p.plano)))
    } catch {setTitulares([]);toast.error('Não foi possível buscar o titular.')}
  }

  const selecionarTitular = (t: any) => {
    setTitularSelecionado(t)
    setTitulares([])
    setBuscaTitular('')
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setFotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return null
    return idadeDependente(dataNascimento, hojeBrasil())
  }

  const validarIdade = (parentesco: string, dataNascimento: string) => {
    const regra = PARENTESCOS.find(p => p.value === parentesco)
    if (!regra || !dataNascimento) {
      setErroIdade(null)
      return true
    }

    const idade = calcularIdade(dataNascimento)
    if (idade === null) {
      setErroIdade(null)
      return true
    }

    if (regra.idadeMin && idade < regra.idadeMin) {
      setErroIdade(`${regra.label} deve ter no mínimo ${regra.idadeMin} anos. Idade atual: ${idade} anos.`)
      return false
    }

    setErroIdade(null)
    return true
  }

  const handleParentescoChange = (value: string) => {
    setForm({ ...form, parentesco: value })
    validarIdade(value, form.data_nascimento)
  }

  const handleDataNascimentoChange = (value: string) => {
    setForm({ ...form, data_nascimento: value })
    validarIdade(form.parentesco, value)
  }

  const getDocumentoObrigatorio = () => {
    const regra = PARENTESCOS.find(p => p.value === form.parentesco)
    return regra?.docObrigatorio || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titularSelecionado) {
      toast.error('Selecione um titular')
      return
    }

    if (!form.nome || !form.data_nascimento || !form.parentesco) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    if (!validarIdade(form.parentesco, form.data_nascimento)) {
      toast.error('Idade não atende aos requisitos do Estatuto')
      return
    }

    if (enviando || loading) return
    const erroDocumento = validarDocumentacao(form.parentesco, form.data_nascimento, docs, hojeBrasil())
    if (erroDocumento) { toast.error(erroDocumento); return }
    setLoading(true)

    try {
      let foto_url = null


      // Upload da foto
      if (foto) {
        const ext = foto.name.split('.').pop()
        const fileName = `dependentes/${titularSelecionado.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('fotos-associados')
          .upload(fileName, foto)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('fotos-associados').getPublicUrl(fileName)
        foto_url = urlData.publicUrl
      }

      const { error } = await supabase.from('dependentes').insert({
        associado_id: titularSelecionado.id,
        nome: form.nome,
        cpf: form.cpf,
        rg: form.rg,
        data_nascimento: form.data_nascimento,
        parentesco: form.parentesco,
        telefone: form.telefone,
        email: form.email,
        foto_url,
        ...Object.fromEntries(Object.entries(docs).map(([k,v]) => [k,v || null])),
        status: 'ativo',
      })

      if (error) throw error

      toast.success('Dependente cadastrado com sucesso!')
      router.push('/dashboard/dependentes')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const parentescoSelecionado = PARENTESCOS.find(p => p.value === form.parentesco)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/dependentes">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Cadastrar Dependente</h1>
      </div>

      {/* Aviso sobre planos */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>Atenção:</strong> Apenas associados dos planos <strong>Familiar</strong> e <strong>Patrimonial</strong> podem cadastrar dependentes (Art. 20 do Estatuto).
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Busca de Titular */}
        <Card>
          <CardHeader>
            <CardTitle>Titular</CardTitle>
            <CardDescription>Selecione o associado titular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!titularSelecionado ? (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="QR Code, título, nome ou CPF..."
                      className="pl-10"
                      value={buscaTitular}
                      onChange={(e) => setBuscaTitular(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();buscarTitulares()}}}
                    />
                  </div>
                  <Button type="button" onClick={buscarTitulares}>Buscar</Button>
                </div>

                {titulares.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {titulares.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        onClick={() => selecionarTitular(t)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {t.foto_url ? (
                              <img src={t.foto_url} alt={t.nome} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-lg font-medium">{t.nome[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{t.nome}</p>
                            <p className="text-sm text-muted-foreground">Título: {t.numero_titulo}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.plano === 'patrimonial' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {t.plano}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {buscaTitular.length >= 2 && titulares.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum associado encontrado com plano Familiar ou Patrimonial
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {titularSelecionado.foto_url ? (
                      <img src={titularSelecionado.foto_url} alt={titularSelecionado.nome} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-medium">{titularSelecionado.nome[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{titularSelecionado.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Título: {titularSelecionado.numero_titulo} | Plano: {titularSelecionado.plano}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => setTitularSelecionado(null)}>
                  Trocar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Dependente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Dependente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              {/* Foto */}
              <div className="flex-shrink-0">
                <Label>Foto</Label>
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <div className="h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} />
                  </label>
                </div>
              </div>

              {/* Campos */}
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome do dependente"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={form.rg}
                      onChange={(e) => setForm({ ...form, rg: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Nascimento *</Label>
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => handleDataNascimentoChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Parentesco *</Label>
                <select
                  className="w-full h-10 border rounded-md px-3"
                  value={form.parentesco}
                  onChange={(e) => handleParentescoChange(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {PARENTESCOS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Regra do parentesco */}
            {parentescoSelecionado && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Regra (Art. 20):</strong> {parentescoSelecionado.regra}
                </p>
              </div>
            )}

            {/* Erro de idade */}
            {erroIdade && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-800">{erroIdade}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <DocumentosDependente supabase={supabase} value={docs} onChange={setDocs} disabled={loading} onBusy={setEnviando} />

        {/* Botões */}
        <div className="flex gap-4">
          <Link href="/dashboard/dependentes" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={loading || enviando || !!erroIdade}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Cadastrar Dependente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
