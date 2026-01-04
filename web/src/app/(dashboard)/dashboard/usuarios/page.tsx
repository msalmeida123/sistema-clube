'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Users, Search, Plus, Edit, Trash2, Save, Loader2, X, 
  Shield, Mail, Phone, Building2, Eye, EyeOff, KeyRound,
  UserCog, Check
} from 'lucide-react'

type Usuario = {
  id: string
  nome: string
  email: string
  telefone: string | null
  setor: string | null
  is_admin: boolean
  ativo: boolean
  perfil_acesso_id: string | null
  permissoes: string[]
  created_at: string
  perfil?: { nome: string }
}

type Perfil = {
  id: string
  nome: string
  descricao: string
}

const setoresDisponiveis = [
  { value: 'administracao', label: 'Administração' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'manutencao', label: 'Manutenção' },
]

const permissoesDisponiveis = [
  { value: 'dashboard', label: 'Dashboard', grupo: null },
  { value: 'associados', label: 'Associados', grupo: null },
  { value: 'dependentes', label: 'Dependentes', grupo: null },
  { value: 'financeiro', label: 'Financeiro', grupo: null },
  { value: 'financeiro_contas', label: '↳ Contas a Pagar', grupo: 'financeiro' },
  { value: 'financeiro_compras', label: '↳ Compras', grupo: 'financeiro' },
  { value: 'compras', label: 'Compras (módulo)', grupo: null },
  { value: 'portaria', label: 'Portaria', grupo: null },
  { value: 'exames', label: 'Exames Médicos', grupo: null },
  { value: 'infracoes', label: 'Infrações', grupo: null },
  { value: 'eleicoes', label: 'Eleições', grupo: null },
  { value: 'relatorios', label: 'Relatórios', grupo: null },
  { value: 'crm', label: 'CRM/WhatsApp', grupo: null },
  { value: 'configuracoes', label: 'Configurações', grupo: null },
  { value: 'usuarios', label: 'Usuários', grupo: null },
]

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    setor: '',
    is_admin: false,
    perfil_acesso_id: '',
    permissoes: [] as string[],
    senha: ''
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    verificarAdmin()
    carregarDados()
  }, [])

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('usuarios')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      setIsAdmin(data?.is_admin || false)
    }
  }

  const carregarDados = async () => {
    setLoading(true)

    const { data: usuariosData, error } = await supabase
      .from('usuarios')
      .select('*, perfil:perfis_acesso(nome)')
      .order('nome')

    if (error) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } else {
      setUsuarios(usuariosData || [])
    }

    const { data: perfisData } = await supabase
      .from('perfis_acesso')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    setPerfis(perfisData || [])

    setLoading(false)
  }

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditando(usuario)
      setForm({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        setor: usuario.setor || '',
        is_admin: usuario.is_admin || false,
        perfil_acesso_id: usuario.perfil_acesso_id || '',
        permissoes: usuario.permissoes || [],
        senha: ''
      })
    } else {
      setEditando(null)
      setForm({
        nome: '',
        email: '',
        telefone: '',
        setor: '',
        is_admin: false,
        perfil_acesso_id: '',
        permissoes: ['dashboard'],
        senha: ''
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setEditando(null)
    setMostrarSenha(false)
  }

  const togglePermissao = (permissao: string) => {
    setForm(prev => {
      const estaMarcada = prev.permissoes.includes(permissao)
      
      if (estaMarcada) {
        // Ao desmarcar, remove a permissão e todas as subpermissões
        const subPermissoes = permissoesDisponiveis
          .filter(p => p.grupo === permissao)
          .map(p => p.value)
        
        return {
          ...prev,
          permissoes: prev.permissoes.filter(p => p !== permissao && !subPermissoes.includes(p))
        }
      } else {
        // Ao marcar, adiciona a permissão
        return {
          ...prev,
          permissoes: [...prev.permissoes, permissao]
        }
      }
    })
  }

  const marcarTodasPermissoes = () => {
    setForm(prev => ({
      ...prev,
      permissoes: permissoesDisponiveis.map(p => p.value)
    }))
  }

  const desmarcarTodasPermissoes = () => {
    setForm(prev => ({
      ...prev,
      permissoes: []
    }))
  }

  const salvar = async () => {
    if (!form.nome || !form.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    setSalvando(true)

    try {
      if (editando) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome: form.nome,
            email: form.email,
            telefone: form.telefone || null,
            setor: form.setor || null,
            is_admin: form.is_admin,
            perfil_acesso_id: form.perfil_acesso_id || null,
            permissoes: form.permissoes
          })
          .eq('id', editando.id)

        if (error) throw error

        // Se forneceu nova senha, atualizar
        if (form.senha) {
          // Isso requer função admin no Supabase
          toast.info('Para alterar a senha, o usuário deve usar "Esqueci minha senha"')
        }

        toast.success('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário
        if (!form.senha || form.senha.length < 6) {
          toast.error('Senha deve ter pelo menos 6 caracteres')
          setSalvando(false)
          return
        }

        // Usar API para criar usuário (não desloga o admin)
        const response = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            telefone: form.telefone || null,
            setor: form.setor || null,
            is_admin: form.is_admin,
            perfil_acesso_id: form.perfil_acesso_id || null,
            permissoes: form.permissoes
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar usuário')
        }

        toast.success('Usuário criado com sucesso!')
      }

      fecharModal()
      carregarDados()
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = async (usuario: Usuario) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !usuario.ativo })
      .eq('id', usuario.id)

    if (error) {
      toast.error('Erro: ' + error.message)
    } else {
      toast.success(usuario.ativo ? 'Usuário desativado' : 'Usuário ativado')
      carregarDados()
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.setor?.toLowerCase().includes(busca.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-red-300">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários do sistema.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-blue-600" />
            Usuários do Sistema
          </h1>
          <p className="text-muted-foreground">Gerencie os usuários que podem acessar o sistema</p>
        </div>
        <Button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou setor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Usuário</th>
                    <th className="text-left p-4 font-medium">Setor</th>
                    <th className="text-left p-4 font-medium">Perfil</th>
                    <th className="text-center p-4 font-medium">Admin</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-center p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map(usuario => (
                      <tr key={usuario.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {usuario.nome?.substring(0, 2).toUpperCase() || '??'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{usuario.nome}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {usuario.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {setoresDisponiveis.find(s => s.value === usuario.setor)?.label || usuario.setor || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          {usuario.perfil ? (
                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {usuario.perfil.nome}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Individual</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {usuario.is_admin ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleAtivo(usuario)}
                            className={`text-xs px-2 py-1 rounded ${
                              usuario.ativo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModal(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <Button variant="ghost" size="icon" onClick={fecharModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Dados básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={form.nome}
                    onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    disabled={!!editando}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={form.telefone}
                    onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Setor</label>
                  <select
                    value={form.setor}
                    onChange={e => setForm(prev => ({ ...prev, setor: e.target.value }))}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="">Selecione...</option>
                    {setoresDisponiveis.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Senha (apenas para novos usuários) */}
              {!editando && (
                <div>
                  <label className="text-sm font-medium">Senha *</label>
                  <div className="relative">
                    <Input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={form.senha}
                      onChange={e => setForm(prev => ({ ...prev, senha: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Perfil de Acesso */}
              <div>
                <label className="text-sm font-medium">Perfil de Acesso</label>
                <select
                  value={form.perfil_acesso_id}
                  onChange={e => setForm(prev => ({ ...prev, perfil_acesso_id: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Sem perfil (permissões individuais)</option>
                  {perfis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Admin */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={form.is_admin}
                  onChange={e => setForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="is_admin" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Administrador (acesso total)
                </label>
              </div>

              {/* Permissões individuais */}
              {!form.is_admin && !form.perfil_acesso_id && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Permissões</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={marcarTodasPermissoes}>
                        Marcar Todas
                      </Button>
                      <Button variant="outline" size="sm" onClick={desmarcarTodasPermissoes}>
                        Desmarcar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {permissoesDisponiveis.map(p => {
                      const isSubPermissao = p.grupo !== null
                      const paiMarcado = !isSubPermissao || form.permissoes.includes(p.grupo!)
                      
                      return (
                        <label
                          key={p.value}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                            isSubPermissao ? 'ml-4 bg-gray-50' : 'hover:bg-gray-50'
                          } ${!paiMarcado ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={form.permissoes.includes(p.value)}
                            onChange={() => togglePermissao(p.value)}
                            disabled={!paiMarcado}
                            className="h-4 w-4"
                          />
                          <span className={`text-sm ${isSubPermissao ? 'text-gray-600' : ''}`}>
                            {p.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando} className="bg-blue-600 hover:bg-blue-700">
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
