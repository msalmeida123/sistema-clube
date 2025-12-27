'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import Link from 'next/link'

export default function EditarAssociadoPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoAtual, setFotoAtual] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', titulo_eleitor: '', email: '', telefone: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    tipo_residencia: 'casa', plano: 'individual', data_nascimento: '', status: 'ativo'
  })

  useEffect(() => {
    const fetchAssociado = async () => {
      const { data } = await supabase
        .from('associados')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setForm({
          nome: data.nome || '',
          cpf: data.cpf || '',
          rg: data.rg || '',
          titulo_eleitor: data.titulo_eleitor || '',
          email: data.email || '',
          telefone: data.telefone || '',
          cep: data.cep || '',
          endereco: data.endereco || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          tipo_residencia: data.tipo_residencia || 'casa',
          plano: data.plano || 'individual',
          data_nascimento: data.data_nascimento || '',
          status: data.status || 'ativo'
        })
        setFotoAtual(data.foto_url)
      }
      setLoadingData(false)
    }
    fetchAssociado()
  }, [id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const buscarCEP = async () => {
    if (form.cep.length < 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${form.cep.replace(/\D/g, '')}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm({ ...form, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf })
      }
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let foto_url = fotoAtual

      // Upload nova foto se selecionada
      if (foto) {
        const ext = foto.name.split('.').pop()
        const path = `${id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('fotos-associados').upload(path, foto)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('fotos-associados').getPublicUrl(path)
        foto_url = publicUrl
      }

      const { error } = await supabase
        .from('associados')
        .update({ ...form, foto_url })
        .eq('id', id)

      if (error) throw error

      toast.success('Associado atualizado com sucesso!')
      router.push(`/dashboard/associados/${id}`)
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/associados/${id}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">Editar Associado</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input name="nome" value={form.nome} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPF *</Label>
                  <Input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
                </div>
                <div>
                  <Label>RG</Label>
                  <Input name="rg" value={form.rg} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título de Eleitor</Label>
                  <Input name="titulo_eleitor" value={form.titulo_eleitor} onChange={handleChange} />
                </div>
                <div>
                  <Label>Data Nascimento</Label>
                  <Input name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <Label>Foto</Label>
                {fotoAtual && !foto && (
                  <div className="mb-2">
                    <img src={fotoAtual} alt="Foto atual" className="h-24 w-24 rounded-lg object-cover border" />
                    <p className="text-xs text-muted-foreground mt-1">Foto atual</p>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
                  {foto && <span className="text-sm text-green-600">✓ Nova: {foto.name}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input name="cep" value={form.cep} onChange={handleChange} onBlur={buscarCEP} placeholder="00000-000" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select name="tipo_residencia" value={form.tipo_residencia} onChange={handleChange} className="w-full h-10 border rounded-md px-3">
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Endereço</Label>
                <Input name="endereco" value={form.endereco} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input name="numero" value={form.numero} onChange={handleChange} />
                </div>
                <div className="col-span-2">
                  <Label>Complemento</Label>
                  <Input name="complemento" value={form.complemento} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input name="bairro" value={form.bairro} onChange={handleChange} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input name="cidade" value={form.cidade} onChange={handleChange} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input name="estado" value={form.estado} onChange={handleChange} maxLength={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano e Status */}
          <Card>
            <CardHeader><CardTitle>Plano e Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Plano *</Label>
                <select name="plano" value={form.plano} onChange={handleChange} className="w-full h-10 border rounded-md px-3">
                  <option value="individual">Individual</option>
                  <option value="familiar">Familiar</option>
                  <option value="patrimonial">Patrimonial</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full h-10 border rounded-md px-3">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="expulso">Expulso</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-end mt-6">
          <Link href={`/dashboard/associados/${id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
