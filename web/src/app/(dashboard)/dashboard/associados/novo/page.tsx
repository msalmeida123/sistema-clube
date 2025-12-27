'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import Link from 'next/link'

export default function NovoAssociadoPage() {
  const [loading, setLoading] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', titulo_eleitor: '', email: '', telefone: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    tipo_residencia: 'casa', plano: 'individual', data_nascimento: ''
  })
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const buscarCEP = async () => {
    if (form.cep.length < 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${form.cep}/json/`)
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
      let foto_url = null
      if (foto) {
        const ext = foto.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('fotos-associados').upload(path, foto)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('fotos-associados').getPublicUrl(path)
        foto_url = publicUrl
      }
      const { error } = await supabase.from('associados').insert({ ...form, foto_url })
      if (error) throw error
      toast({ title: 'Sucesso!', description: 'Associado cadastrado com sucesso.' })
      router.push('/dashboard/associados')
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/associados"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h2 className="text-2xl font-bold">Novo Associado</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome Completo *</Label><Input name="nome" value={form.nome} onChange={handleChange} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>CPF *</Label><Input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" required /></div>
                <div><Label>RG</Label><Input name="rg" value={form.rg} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Título de Eleitor</Label><Input name="titulo_eleitor" value={form.titulo_eleitor} onChange={handleChange} /></div>
                <div><Label>Data Nascimento</Label><Input name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input name="email" type="email" value={form.email} onChange={handleChange} /></div>
                <div><Label>Telefone</Label><Input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" /></div>
              </div>
              <div>
                <Label>Foto</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
                  {foto && <span className="text-sm text-green-600">✓ {foto.name}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>CEP</Label><Input name="cep" value={form.cep} onChange={handleChange} onBlur={buscarCEP} placeholder="00000-000" /></div>
                <div>
                  <Label>Tipo</Label>
                  <select name="tipo_residencia" value={form.tipo_residencia} onChange={handleChange} className="w-full h-10 border rounded-md px-3">
                    <option value="casa">Casa</option><option value="apartamento">Apartamento</option>
                  </select>
                </div>
              </div>
              <div><Label>Endereço</Label><Input name="endereco" value={form.endereco} onChange={handleChange} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Número</Label><Input name="numero" value={form.numero} onChange={handleChange} /></div>
                <div className="col-span-2"><Label>Complemento</Label><Input name="complemento" value={form.complemento} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Bairro</Label><Input name="bairro" value={form.bairro} onChange={handleChange} /></div>
                <div><Label>Cidade</Label><Input name="cidade" value={form.cidade} onChange={handleChange} /></div>
                <div><Label>Estado</Label><Input name="estado" value={form.estado} onChange={handleChange} maxLength={2} /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plano</CardTitle></CardHeader>
            <CardContent>
              <Label>Categoria *</Label>
              <select name="plano" value={form.plano} onChange={handleChange} className="w-full h-10 border rounded-md px-3">
                <option value="individual">Individual</option><option value="familiar">Familiar</option><option value="patrimonial">Patrimonial</option>
              </select>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={loading}><Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar Associado'}</Button>
        </div>
      </form>
    </div>
  )
}
