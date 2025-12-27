'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Building2, CreditCard, MessageSquare, Users, Plus, Trash2, Edit, X, Shield, Upload, Image } from 'lucide-react'

const MODULOS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Visualizar painel inicial' },
  { id: 'associados', label: 'Associados', desc: 'Cadastro e gestão de associados' },
  { id: 'dependentes', label: 'Dependentes', desc: 'Cadastro e gestão de dependentes' },
  { id: 'financeiro', label: 'Financeiro', desc: 'Mensalidades, boletos e PIX' },
  { id: 'compras', label: 'Compras', desc: 'Orçamentos e compras' },
  { id: 'portaria', label: 'Portaria', desc: 'Controle de acesso' },
  { id: 'exames', label: 'Exames Médicos', desc: 'Gestão de exames' },
  { id: 'infracoes', label: 'Infrações', desc: 'Registro de infrações' },
  { id: 'eleicoes', label: 'Eleições', desc: 'Gestão de eleições' },
  { id: 'relatorios', label: 'Relatórios', desc: 'Visualizar relatórios' },
  { id: 'crm', label: 'CRM', desc: 'WhatsApp e atendimento' },
  { id: 'configuracoes', label: 'Configurações', desc: 'Configurar sistema' },
  { id: 'usuarios', label: 'Usuários', desc: 'Gerenciar usuários' },
]

type Usuario = {
  id: string
  nome: string
  email: string
  ativo: boolean
  is_admin: boolean
  permissoes: string[]
  created_at: string
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'clube' | 'usuarios' | 'sicoob' | 'wasender'>('clube')
  const [clube, setClube] = useState({
    id: '',
    nome: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    telefone2: '',
    email: '',
    site: '',
    logo_url: '',
    data_fundacao: '',
    presidente: '',
    vice_presidente: '',
    responsavel_financeiro: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [sicoob, setSicoob] = useState({ id: '', client_id: '', client_secret: '', ambiente: 'sandbox', pix_chave: '', agencia: '', conta_corrente: '' })
  const [wasender, setWasender] = useState({ id: '', api_key: '', device_id: '', webhook_url: '', personal_token: '' })
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [showNovoUsuario, setShowNovoUsuario] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', is_admin: false, permissoes: ['dashboard'] as string[] })
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: c } = await supabase.from('clube_config').select('*').limit(1).single()
      if (c) {
        setClube(c)
        if (c.logo_url) setLogoPreview(c.logo_url)
      }
      const { data: s } = await supabase.from('config_sicoob').select('*').limit(1).single()
      if (s) setSicoob(s)
      const { data: w } = await supabase.from('config_wasender').select('*').limit(1).single()
      if (w) setWasender(w)
    }
    fetch()
  }, [supabase])

  useEffect(() => {
    if (tab === 'usuarios') carregarUsuarios()
  }, [tab])

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true)
    const { data } = await supabase.from('usuarios').select('*').order('nome')
    if (data) setUsuarios(data.map(u => ({ ...u, permissoes: u.permissoes || [] })))
    setLoadingUsuarios(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return clube.logo_url

    const ext = logoFile.name.split('.').pop()
    const fileName = `logo_clube.${ext}`
    const filePath = `clube/${fileName}`

    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, logoFile, { upsert: true })

    if (error) throw error

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath)
    return urlData.publicUrl
  }

  const togglePermissao = (permissoes: string[], modulo: string) => {
    if (permissoes.includes(modulo)) {
      return permissoes.filter(p => p !== modulo)
    }
    return [...permissoes, modulo]
  }

  const toggleNovaPermissao = (modulo: string) => {
    setNovoUsuario({ ...novoUsuario, permissoes: togglePermissao(novoUsuario.permissoes, modulo) })
  }

  const toggleEditPermissao = (modulo: string) => {
    if (!editandoUsuario) return
    setEditandoUsuario({ ...editandoUsuario, permissoes: togglePermissao(editandoUsuario.permissoes, modulo) })
  }

  const marcarTodas = (isNovo: boolean) => {
    const todas = MODULOS.map(m => m.id)
    if (isNovo) {
      setNovoUsuario({ ...novoUsuario, permissoes: todas })
    } else if (editandoUsuario) {
      setEditandoUsuario({ ...editandoUsuario, permissoes: todas })
    }
  }

  const desmarcarTodas = (isNovo: boolean) => {
    if (isNovo) {
      setNovoUsuario({ ...novoUsuario, permissoes: [] })
    } else if (editandoUsuario) {
      setEditandoUsuario({ ...editandoUsuario, permissoes: [] })
    }
  }

  const criarUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!novoUsuario.is_admin && novoUsuario.permissoes.length === 0) {
      toast.error('Selecione pelo menos uma permissão')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
      })

      if (authError) throw authError

      const { error: dbError } = await supabase.from('usuarios').insert({
        id: authData.user?.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        is_admin: novoUsuario.is_admin,
        permissoes: novoUsuario.is_admin ? MODULOS.map(m => m.id) : novoUsuario.permissoes,
        ativo: true,
      })

      if (dbError) throw dbError

      toast.success('Usuário criado com sucesso!')
      setShowNovoUsuario(false)
      setNovoUsuario({ nome: '', email: '', senha: '', is_admin: false, permissoes: ['dashboard'] })
      carregarUsuarios()
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const atualizarUsuario = async () => {
    if (!editandoUsuario) return

    if (!editandoUsuario.is_admin && editandoUsuario.permissoes.length === 0) {
      toast.error('Selecione pelo menos uma permissão')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: editandoUsuario.nome,
          is_admin: editandoUsuario.is_admin,
          permissoes: editandoUsuario.is_admin ? MODULOS.map(m => m.id) : editandoUsuario.permissoes,
          ativo: editandoUsuario.ativo,
        })
        .eq('id', editandoUsuario.id)

      if (error) throw error

      toast.success('Usuário atualizado!')
      setEditandoUsuario(null)
      carregarUsuarios()
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const excluirUsuario = async (id: string, nome: string) => {
    if (!confirm(`Deseja excluir o usuário "${nome}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id)
      if (error) throw error
      toast.success('Usuário excluído!')
      carregarUsuarios()
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const salvarClube = async () => {
    if (!clube.nome) {
      toast.error('Informe o nome do clube')
      return
    }

    setLoading(true)
    try {
      let logo_url = clube.logo_url
      if (logoFile) {
        logo_url = await uploadLogo()
      }

      const dadosClube = { ...clube, logo_url }
      
      // Se não tem ID, remove o campo para o Supabase gerar automaticamente
      if (!dadosClube.id) {
        delete (dadosClube as any).id
        const { data, error } = await supabase.from('clube_config').insert(dadosClube).select().single()
        if (error) throw error
        setClube(data)
      } else {
        const { error } = await supabase.from('clube_config').update(dadosClube).eq('id', dadosClube.id)
        if (error) throw error
        setClube(dadosClube)
      }
      
      setLogoFile(null)
      toast.success('Dados do clube salvos com sucesso!')
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally { 
      setLoading(false) 
    }
  }

  const salvarSicoob = async () => {
    setLoading(true)
    try {
      if (!sicoob.id) {
        const dados = { ...sicoob }
        delete (dados as any).id
        const { data, error } = await supabase.from('config_sicoob').insert(dados).select().single()
        if (error) throw error
        setSicoob(data)
      } else {
        const { error } = await supabase.from('config_sicoob').update(sicoob).eq('id', sicoob.id)
        if (error) throw error
      }
      toast.success('Configurações Sicoob salvas.')
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally { setLoading(false) }
  }

  const salvarWasender = async () => {
    setLoading(true)
    try {
      if (!wasender.id) {
        const dados = { ...wasender }
        delete (dados as any).id
        const { data, error } = await supabase.from('config_wasender').insert(dados).select().single()
        if (error) throw error
        setWasender(data)
      } else {
        const { error } = await supabase.from('config_wasender').update(wasender).eq('id', wasender.id)
        if (error) throw error
      }
      toast.success('Configurações WaSender salvas.')
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally { setLoading(false) }
  }

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setClube({
          ...clube,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const tabs = [
    { id: 'clube', label: 'Dados do Clube', icon: Building2 },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'sicoob', label: 'Sicoob (Pagamentos)', icon: CreditCard },
    { id: 'wasender', label: 'WaSenderAPI', icon: MessageSquare },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent hover:text-primary'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'clube' && (
        <div className="space-y-6">
          {/* Logo e Nome */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação do Clube</CardTitle>
              <CardDescription>Logo e nome do clube</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 items-start">
                {/* Upload de Logo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Image className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <Label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span>Enviar Logo</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </Label>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                </div>

                {/* Nome e Nome Fantasia */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Nome do Clube (Razão Social) *</Label>
                    <Input 
                      value={clube.nome} 
                      onChange={(e) => setClube({ ...clube, nome: e.target.value })} 
                      placeholder="Ex: Associação Recreativa dos Funcionários..."
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label>Nome Fantasia</Label>
                    <Input 
                      value={clube.nome_fantasia} 
                      onChange={(e) => setClube({ ...clube, nome_fantasia: e.target.value })} 
                      placeholder="Ex: Clube dos Funcionários"
                    />
                  </div>
                  <div>
                    <Label>Data de Fundação</Label>
                    <Input 
                      type="date"
                      value={clube.data_fundacao} 
                      onChange={(e) => setClube({ ...clube, data_fundacao: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>CNPJ e inscrições</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input 
                    value={clube.cnpj} 
                    onChange={(e) => setClube({ ...clube, cnpj: e.target.value })} 
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label>Inscrição Estadual</Label>
                  <Input 
                    value={clube.inscricao_estadual} 
                    onChange={(e) => setClube({ ...clube, inscricao_estadual: e.target.value })} 
                    placeholder="Isento ou número"
                  />
                </div>
                <div>
                  <Label>Inscrição Municipal</Label>
                  <Input 
                    value={clube.inscricao_municipal} 
                    onChange={(e) => setClube({ ...clube, inscricao_municipal: e.target.value })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização do clube</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input 
                    value={clube.cep} 
                    onChange={(e) => setClube({ ...clube, cep: e.target.value })} 
                    onBlur={(e) => buscarCep(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={clube.endereco} 
                    onChange={(e) => setClube({ ...clube, endereco: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input 
                    value={clube.numero} 
                    onChange={(e) => setClube({ ...clube, numero: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Complemento</Label>
                  <Input 
                    value={clube.complemento} 
                    onChange={(e) => setClube({ ...clube, complemento: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input 
                    value={clube.bairro} 
                    onChange={(e) => setClube({ ...clube, bairro: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input 
                    value={clube.cidade} 
                    onChange={(e) => setClube({ ...clube, cidade: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input 
                    value={clube.estado} 
                    onChange={(e) => setClube({ ...clube, estado: e.target.value })} 
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Telefones e email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Telefone Principal</Label>
                  <Input 
                    value={clube.telefone} 
                    onChange={(e) => setClube({ ...clube, telefone: e.target.value })} 
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label>Telefone 2</Label>
                  <Input 
                    value={clube.telefone2} 
                    onChange={(e) => setClube({ ...clube, telefone2: e.target.value })} 
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={clube.email} 
                    onChange={(e) => setClube({ ...clube, email: e.target.value })} 
                    placeholder="contato@clube.com.br"
                  />
                </div>
                <div>
                  <Label>Site</Label>
                  <Input 
                    value={clube.site} 
                    onChange={(e) => setClube({ ...clube, site: e.target.value })} 
                    placeholder="www.clube.com.br"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diretoria */}
          <Card>
            <CardHeader>
              <CardTitle>Diretoria Atual</CardTitle>
              <CardDescription>Responsáveis pelo clube</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Presidente</Label>
                  <Input 
                    value={clube.presidente} 
                    onChange={(e) => setClube({ ...clube, presidente: e.target.value })} 
                    placeholder="Nome do presidente"
                  />
                </div>
                <div>
                  <Label>Vice-Presidente</Label>
                  <Input 
                    value={clube.vice_presidente} 
                    onChange={(e) => setClube({ ...clube, vice_presidente: e.target.value })} 
                    placeholder="Nome do vice"
                  />
                </div>
                <div>
                  <Label>Responsável Financeiro</Label>
                  <Input 
                    value={clube.responsavel_financeiro} 
                    onChange={(e) => setClube({ ...clube, responsavel_financeiro: e.target.value })} 
                    placeholder="Nome do tesoureiro"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={salvarClube} disabled={loading} size="lg">
            <Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar Dados do Clube'}
          </Button>
        </div>
      )}

      {tab === 'sicoob' && (
        <Card>
          <CardHeader><CardTitle>Integração Sicoob</CardTitle><CardDescription>Configure a API do Sicoob para boletos e PIX</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Client ID</Label><Input value={sicoob.client_id} onChange={(e) => setSicoob({ ...sicoob, client_id: e.target.value })} /></div>
              <div><Label>Client Secret</Label><Input type="password" value={sicoob.client_secret} onChange={(e) => setSicoob({ ...sicoob, client_secret: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Ambiente</Label>
                <select value={sicoob.ambiente} onChange={(e) => setSicoob({ ...sicoob, ambiente: e.target.value })} className="w-full h-10 border rounded-md px-3">
                  <option value="sandbox">Sandbox (Teste)</option><option value="producao">Produção</option>
                </select>
              </div>
              <div><Label>Agência</Label><Input value={sicoob.agencia} onChange={(e) => setSicoob({ ...sicoob, agencia: e.target.value })} /></div>
              <div><Label>Conta Corrente</Label><Input value={sicoob.conta_corrente} onChange={(e) => setSicoob({ ...sicoob, conta_corrente: e.target.value })} /></div>
            </div>
            <div><Label>Chave PIX</Label><Input value={sicoob.pix_chave} onChange={(e) => setSicoob({ ...sicoob, pix_chave: e.target.value })} placeholder="CNPJ, Email, Telefone ou Chave Aleatória" /></div>
            <Button onClick={salvarSicoob} disabled={loading}><Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar'}</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'wasender' && (
        <Card>
          <CardHeader><CardTitle>Integração WaSenderAPI</CardTitle><CardDescription>Configure o WhatsApp para CRM e notificações</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>API Key (da Sessão)</Label><Input type="password" value={wasender.api_key} onChange={(e) => setWasender({ ...wasender, api_key: e.target.value })} placeholder="Token gerado ao conectar a sessão" /></div>
            <div><Label>Personal Access Token</Label><Input type="password" value={wasender.personal_token} onChange={(e) => setWasender({ ...wasender, personal_token: e.target.value })} placeholder="Token das configurações da conta WaSender" /><p className="text-xs text-muted-foreground mt-1">Obtenha em wasenderapi.com/dashboard → Settings → Personal Access Token</p></div>
            <div><Label>Device ID (Session ID)</Label><Input value={wasender.device_id} onChange={(e) => setWasender({ ...wasender, device_id: e.target.value })} placeholder="Ex: 40935" /></div>
            <div><Label>Webhook URL</Label><Input value={wasender.webhook_url} onChange={(e) => setWasender({ ...wasender, webhook_url: e.target.value })} placeholder="https://seudominio.com/api/webhook/wasender" /></div>
            <Button onClick={salvarWasender} disabled={loading}><Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar'}</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'usuarios' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários do Sistema</CardTitle>
                <CardDescription>Gerencie os usuários e defina suas permissões</CardDescription>
              </div>
              <Button onClick={() => setShowNovoUsuario(true)}>
                <Plus className="h-4 w-4 mr-2" />Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : usuarios.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Permissões</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{u.nome}</td>
                          <td className="py-3 px-4">{u.email}</td>
                          <td className="py-3 px-4">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Shield className="h-3 w-3" />Admin
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Usuário
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {u.is_admin ? 'Acesso total' : `${u.permissoes?.length || 0} módulos`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setEditandoUsuario(u)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => excluirUsuario(u.id, u.nome)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal Novo Usuário */}
          {showNovoUsuario && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
              <Card className="w-full max-w-lg mx-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Novo Usuário</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowNovoUsuario(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} placeholder="Nome do usuário" />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label>Senha *</Label>
                    <Input type="password" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} placeholder="Mínimo 6 caracteres" />
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="flex items-center gap-2">
                        <input type="checkbox" checked={novoUsuario.is_admin} onChange={(e) => setNovoUsuario({ ...novoUsuario, is_admin: e.target.checked })} className="h-4 w-4" />
                        <Shield className="h-4 w-4 text-purple-600" />
                        Administrador (acesso total)
                      </Label>
                    </div>

                    {!novoUsuario.is_admin && (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <Label>Permissões</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => marcarTodas(true)}>Marcar Todas</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => desmarcarTodas(true)}>Desmarcar</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {MODULOS.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={novoUsuario.permissoes.includes(m.id)} onChange={() => toggleNovaPermissao(m.id)} className="h-4 w-4" />
                              <span className="text-sm">{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowNovoUsuario(false)} className="flex-1">Cancelar</Button>
                    <Button onClick={criarUsuario} disabled={loading} className="flex-1">{loading ? 'Criando...' : 'Criar Usuário'}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modal Editar Usuário */}
          {editandoUsuario && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
              <Card className="w-full max-w-lg mx-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Editar Usuário</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditandoUsuario(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input value={editandoUsuario.nome} onChange={(e) => setEditandoUsuario({ ...editandoUsuario, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={editandoUsuario.email} disabled className="bg-gray-100" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={editandoUsuario.ativo} onChange={() => setEditandoUsuario({ ...editandoUsuario, ativo: true })} />
                        Ativo
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={!editandoUsuario.ativo} onChange={() => setEditandoUsuario({ ...editandoUsuario, ativo: false })} />
                        Inativo
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="flex items-center gap-2">
                        <input type="checkbox" checked={editandoUsuario.is_admin} onChange={(e) => setEditandoUsuario({ ...editandoUsuario, is_admin: e.target.checked })} className="h-4 w-4" />
                        <Shield className="h-4 w-4 text-purple-600" />
                        Administrador (acesso total)
                      </Label>
                    </div>

                    {!editandoUsuario.is_admin && (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <Label>Permissões</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => marcarTodas(false)}>Marcar Todas</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => desmarcarTodas(false)}>Desmarcar</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {MODULOS.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={editandoUsuario.permissoes?.includes(m.id)} onChange={() => toggleEditPermissao(m.id)} className="h-4 w-4" />
                              <span className="text-sm">{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setEditandoUsuario(null)} className="flex-1">Cancelar</Button>
                    <Button onClick={atualizarUsuario} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Salvar'}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
