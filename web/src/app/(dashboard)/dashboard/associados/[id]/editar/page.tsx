'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { InputAssociado as Input } from '@/components/InputAssociado'
import {formatarCpf,formatarRg} from '@/lib/validacao-associado'
import {useErrosAssociado} from '@/hooks/useErrosAssociado'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import Link from 'next/link'
import {CnpjAssociado} from '@/components/CnpjAssociado'
import {EmpresaVinculada} from '@/components/EmpresaVinculada'
import {dadosDocumento} from '@/lib/cnpj'
import {useCep} from '@/hooks/useCep'

export default function EditarAssociadoPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const validacao=useErrosAssociado()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoAtual, setFotoAtual] = useState<string | null>(null)
  const [form, setForm] = useState({
    sexo:'',tipo_cadastro:'pf',cnpj:'',nome_fantasia:'',empresa_associada_id:'',nome: '', cpf: '', rg: '', titulo_eleitor: '', email: '', telefone: '',
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
          sexo:data.sexo||'',tipo_cadastro:data.tipo_cadastro||'pf',cnpj:data.cnpj||'',nome_fantasia:data.nome_fantasia||'',empresa_associada_id:data.empresa_associada_id||'',nome: data.nome || '',
          cpf: data.cpf || '',
          rg: data.rg && /^(?:\d{8}[0-9X]|\d{2}\.\d{3}\.\d{3}-[0-9X])$/i.test(data.rg) ? formatarRg(data.rg) : data.rg || '',
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
    setForm({ ...form, [e.target.name]: e.target.name==='cpf'?formatarCpf(e.target.value):e.target.name==='rg'?formatarRg(e.target.value):e.target.value })
  }

  const {buscarCEP,mensagemCep}=useCep(data => setForm(prev => ({...prev,endereco:data.endereco||prev.endereco,bairro:data.bairro||prev.bairro,cidade:data.cidade,estado:data.estado})))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!validacao.validarTudo())return
    setLoading(true)
    try {
      let foto_url = fotoAtual

      // Upload nova foto se selecionada
      if (foto) {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
        if (!tiposPermitidos.includes(foto.type) || foto.size > 10 * 1024 * 1024) {
          throw { campo: 'foto' }
        }
        const ext = foto.type === 'image/png' ? 'png' : foto.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('fotos-associados').upload(path, foto, {
          contentType: foto.type,
          upsert: false,
        })
        if (upErr) throw {...upErr,campo:'foto'}
        const { data: { publicUrl } } = supabase.storage.from('fotos-associados').getPublicUrl(path)
        foto_url = publicUrl
      }

      const { error } = await supabase
        .from('associados')
        .update({ ...dadosDocumento(form),empresa_associada_id:form.tipo_cadastro==='pf'?(form.empresa_associada_id||null):null, foto_url })
        .eq('id', id)

      if (error) throw error

      toast.success('Associado atualizado com sucesso!')
      router.push(`/dashboard/associados/${id}`)
    } catch (error: any) {
      validacao.erroServidor(error)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  return (
    <div className="cadastro-associado mx-auto w-full min-w-0 max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/dashboard/associados/${id}`}>
          <Button aria-label="Voltar para associados" variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold">Editar Associado</h2>
      </div>

      <form ref={validacao.formRef} noValidate onBlurCapture={validacao.onBlurCapture} onChangeCapture={validacao.onChangeCapture} onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-muted-foreground">Todos os campos marcados com * são obrigatórios.</p>
        {validacao.erroGeral&&<p role="alert" className="mb-4 rounded-md border border-red-600 bg-red-50 p-3 text-red-700">{validacao.erroGeral}</p>}
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          {/* Dados Pessoais */}
          <Card className="min-w-0">
            <CardHeader><CardTitle>{form.tipo_cadastro==='pj'?'Dados da empresa':'Dados pessoais'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="tipo-cadastro">Tipo de associado *</Label><select id="tipo-cadastro" required name="tipo_cadastro" value={form.tipo_cadastro} onChange={handleChange} className="w-full h-10 border rounded-md px-3"><option value="pf">Pessoa física</option><option value="pj">Pessoa jurídica — empresa</option></select></div>
              {form.tipo_cadastro==='pj'&&<><CnpjAssociado value={form.cnpj} erro={validacao.erros.cnpj} onChange={cnpj=>setForm(prev=>({...prev,cnpj}))} onEmpresa={empresa=>setForm(prev=>prev.tipo_cadastro==='pj'?{...prev,...Object.fromEntries(Object.entries(empresa).filter(([k])=>['nome','nome_fantasia','cep','endereco','numero','complemento','bairro','cidade','estado'].includes(k)))}:prev)}/><div><Label htmlFor="associado-nome_fantasia">Nome fantasia *</Label><Input name="nome_fantasia" required erro={validacao.erros.nome_fantasia} value={form.nome_fantasia} onChange={handleChange}/></div></>}
              {form.tipo_cadastro==='pf'&&<EmpresaVinculada erro={validacao.erros.empresa_associada_id} value={form.empresa_associada_id} onChange={empresa_associada_id=>setForm(prev=>({...prev,empresa_associada_id}))}/>}

              <div>
                <Label htmlFor="associado-nome">{form.tipo_cadastro==='pj'?'Razão social *':'Nome completo *'}</Label>
                <Input name="nome" required erro={validacao.erros.nome} value={form.nome} onChange={handleChange} />
              </div>
              {form.tipo_cadastro==='pf'&&<>
              <div><Label htmlFor="associado-sexo">Sexo *</Label><select required name="sexo" id="associado-sexo" value={form.sexo} onChange={handleChange} aria-invalid={!!validacao.erros.sexo} aria-describedby={validacao.erros.sexo?'associado-sexo-erro':undefined} className={`w-full min-w-0 h-11 border rounded-md px-3 ${validacao.erros.sexo?'border-red-600 bg-red-50':''}`}><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="nao_informar">Prefiro não informar</option></select>{validacao.erros.sexo&&<p id="associado-sexo-erro" role="alert" className="text-red-700">{validacao.erros.sexo}</p>}</div>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="associado-cpf">CPF *</Label>
                  <Input name="cpf" required erro={validacao.erros.cpf} value={formatarCpf(form.cpf)} inputMode="numeric" autoComplete="off" onChange={handleChange} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label htmlFor="associado-rg">RG *</Label>
                  <Input name="rg" maxLength={12} placeholder="12.345.678-9" autoCapitalize="characters" required erro={validacao.erros.rg} value={form.rg} onChange={handleChange} />
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="associado-titulo_eleitor">Título de Eleitor *</Label>
                  <Input name="titulo_eleitor" required erro={validacao.erros.titulo_eleitor} value={form.titulo_eleitor} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="associado-data_nascimento">Data Nascimento *</Label>
                  <Input name="data_nascimento" required erro={validacao.erros.data_nascimento} type="date" value={form.data_nascimento} onChange={handleChange} />
                </div>
              </div>
              </>}
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="associado-email">Email *</Label>
                  <Input name="email" required erro={validacao.erros.email} type="email" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="associado-telefone">Telefone *</Label>
                  <Input name="telefone" required erro={validacao.erros.telefone} value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <Label htmlFor="associado-foto">Foto *</Label>
                {fotoAtual && !foto && (
                  <div className="mb-2">
                    <img src={fotoAtual} alt="Foto atual" className="h-24 w-24 rounded-lg object-contain object-center bg-gray-100 border" />
                    <p className="text-xs text-muted-foreground mt-1">Foto atual</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <Input required={!fotoAtual} name="foto" erro={validacao.erros.foto} type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
                  {foto && <span className="text-sm text-green-600">✓ Nova: {foto.name}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="min-w-0">
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="associado-cep">CEP *</Label>
                  <Input name="cep" required erro={validacao.erros.cep} value={form.cep} onChange={e => {handleChange(e); void buscarCEP(e.target.value)}} inputMode="numeric" maxLength={9} placeholder="00000-000" /><p role="status" className="text-xs text-muted-foreground mt-1">{mensagemCep}</p>
                </div>
                <div>
                  <Label htmlFor="associado-tipo_residencia">Tipo *</Label>
                  <select required name="tipo_residencia" id="associado-tipo_residencia" aria-invalid={!!validacao.erros.tipo_residencia} value={form.tipo_residencia} onChange={handleChange} aria-describedby={validacao.erros.tipo_residencia?"associado-tipo_residencia-erro":undefined} className={`w-full h-10 border rounded-md px-3 ${validacao.erros.tipo_residencia?"border-red-600 bg-red-50":""}`}>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                  </select>{validacao.erros.tipo_residencia&&<p id="associado-tipo_residencia-erro" role="alert" className="mt-1 text-sm text-red-700">{validacao.erros.tipo_residencia}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="associado-endereco">Endereço *</Label>
                <Input name="endereco" required erro={validacao.erros.endereco} value={form.endereco} onChange={handleChange} />
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="associado-numero">Número *</Label>
                  <Input name="numero" required erro={validacao.erros.numero} value={form.numero} onChange={handleChange} />
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <Label htmlFor="associado-complemento">Complemento (opcional)</Label>
                  <Input name="complemento" erro={validacao.erros.complemento} value={form.complemento} onChange={handleChange} />
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="associado-bairro">Bairro *</Label>
                  <Input name="bairro" required erro={validacao.erros.bairro} value={form.bairro} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="associado-cidade">Cidade *</Label>
                  <Input name="cidade" required erro={validacao.erros.cidade} value={form.cidade} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="associado-estado">Estado *</Label>
                  <Input name="estado" required erro={validacao.erros.estado} value={form.estado} onChange={handleChange} maxLength={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano e Status */}
          <Card className="min-w-0">
            <CardHeader><CardTitle>Plano e Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Plano *</Label>
                <select required name="plano" id="associado-plano" aria-invalid={!!validacao.erros.plano} value={form.plano} onChange={handleChange} aria-describedby={validacao.erros.plano?"associado-plano-erro":undefined} className={`w-full h-10 border rounded-md px-3 ${validacao.erros.plano?"border-red-600 bg-red-50":""}`}>
                  <option value="individual">Individual</option>
                  <option value="familiar">Familiar</option>
                  <option value="patrimonial">Patrimonial</option>
                </select>{validacao.erros.plano&&<p id="associado-plano-erro" role="alert" className="mt-1 text-sm text-red-700">{validacao.erros.plano}</p>}
              </div>
              <div>
                <Label>Status *</Label>
                <select required name="status" id="associado-status" aria-invalid={!!validacao.erros.status} value={form.status} onChange={handleChange} aria-describedby={validacao.erros.status?"associado-status-erro":undefined} className={`w-full h-10 border rounded-md px-3 ${validacao.erros.status?"border-red-600 bg-red-50":""}`}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="expulso">Expulso</option>
                </select>{validacao.erros.status&&<p id="associado-status-erro" role="alert" className="mt-1 text-sm text-red-700">{validacao.erros.status}</p>}
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
