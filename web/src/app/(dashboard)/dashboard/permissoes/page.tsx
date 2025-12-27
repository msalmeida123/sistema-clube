'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Shield, Users, Search, Check, X, ChevronDown, ChevronRight,
  Eye, Plus, Edit, Trash2, Save, UserCog, Loader2, Copy
} from 'lucide-react'

type Pagina = {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  rota: string
  pagina_pai_id: string | null
  ordem: number
  subpaginas?: Pagina[]
}

type Usuario = {
  id: string
  nome: string
  email: string
  setor: string
  is_admin: boolean
  perfil_acesso_id: string | null
  perfil?: { nome: string }
}

type Perfil = {
  id: string
  nome: string
  descricao: string
}

type Permissao = {
  pagina_id: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export default function PermissoesPage() {
  const [tab, setTab] = useState<'usuarios' | 'perfis'>('usuarios')
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [perfilSelecionado, setPerfilSelecionado] = useState<Perfil | null>(null)
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)

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

    const { data: paginasData } = await supabase
      .from('paginas_sistema')
      .select('*')
      .eq('ativo', true)
      .order('ordem')

    const paginasPai = (paginasData || []).filter(p => !p.pagina_pai_id)
    const paginasOrganizadas = paginasPai.map(pai => ({
      ...pai,
      subpaginas: (paginasData || []).filter(p => p.pagina_pai_id === pai.id)
    }))
    setPaginas(paginasOrganizadas)

    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('*, perfil:perfis_acesso(nome)')
      .order('nome')
    setUsuarios(usuariosData || [])

    const { data: perfisData } = await supabase
      .from('perfis_acesso')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    setPerfis(perfisData || [])

    setLoading(false)
  }

  const carregarPermissoesUsuario = async (usuario: Usuario) => {
    setUsuarioSelecionado(usuario)
    setPerfilSelecionado(null)

    const { data: permissoesData } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .eq('usuario_id', usuario.id)

    const permissoesMap: Record<string, Permissao> = {}
    
    if (usuario.perfil_acesso_id) {
      const { data: permissoesPerfil } = await supabase
        .from('permissoes_perfil')
        .select('*')
        .eq('perfil_id', usuario.perfil_acesso_id)

      ;(permissoesPerfil || []).forEach(p => {
        permissoesMap[p.pagina_id] = {
          pagina_id: p.pagina_id,
          pode_visualizar: p.pode_visualizar,
          pode_criar: p.pode_criar,
          pode_editar: p.pode_editar,
          pode_excluir: p.pode_excluir
        }
      })
    }

    ;(permissoesData || []).forEach(p => {
      permissoesMap[p.pagina_id] = {
        pagina_id: p.pagina_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir
      }
    })

    setPermissoes(permissoesMap)
  }

  const carregarPermissoesPerfil = async (perfil: Perfil) => {
    setPerfilSelecionado(perfil)
    setUsuarioSelecionado(null)

    const { data: permissoesData } = await supabase
      .from('permissoes_perfil')
      .select('*')
      .eq('perfil_id', perfil.id)

    const permissoesMap: Record<string, Permissao> = {}
    ;(permissoesData || []).forEach(p => {
      permissoesMap[p.pagina_id] = {
        pagina_id: p.pagina_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir
      }
    })

    setPermissoes(permissoesMap)
  }

  const togglePermissao = (paginaId: string, tipo: keyof Permissao) => {
    if (tipo === 'pagina_id') return

    setPermissoes(prev => {
      const atual = prev[paginaId] || {
        pagina_id: paginaId,
        pode_visualizar: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false
      }

      if (tipo === 'pode_visualizar' && atual.pode_visualizar) {
        return {
          ...prev,
          [paginaId]: {
            ...atual,
            pode_visualizar: false,
            pode_criar: false,
            pode_editar: false,
            pode_excluir: false
          }
        }
      }

      if (tipo !== 'pode_visualizar' && !atual.pode_visualizar) {
        return {
          ...prev,
          [paginaId]: {
            ...atual,
            pode_visualizar: true,
            [tipo]: !atual[tipo]
          }
        }
      }

      return {
        ...prev,
        [paginaId]: {
          ...atual,
          [tipo]: !atual[tipo]
        }
      }
    })
  }

  const marcarTodos = (paginaId: string, marcar: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [paginaId]: {
        pagina_id: paginaId,
        pode_visualizar: marcar,
        pode_criar: marcar,
        pode_editar: marcar,
        pode_excluir: marcar
      }
    }))
  }

  const salvarPermissoes = async () => {
    if (!usuarioSelecionado && !perfilSelecionado) return

    setSalvando(true)

    try {
      if (usuarioSelecionado) {
        await supabase
          .from('permissoes_usuario')
          .delete()
          .eq('usuario_id', usuarioSelecionado.id)

        const novasPermissoes = Object.values(permissoes)
          .filter(p => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_excluir)
          .map(p => ({
            usuario_id: usuarioSelecionado.id,
            pagina_id: p.pagina_id,
            pode_visualizar: p.pode_visualizar,
            pode_criar: p.pode_criar,
            pode_editar: p.pode_editar,
            pode_excluir: p.pode_excluir
          }))

        if (novasPermissoes.length > 0) {
          await supabase.from('permissoes_usuario').insert(novasPermissoes)
        }

        toast.success(`Permissões de ${usuarioSelecionado.nome} salvas!`)
      } else if (perfilSelecionado) {
        await supabase
          .from('permissoes_perfil')
          .delete()
          .eq('perfil_id', perfilSelecionado.id)

        const novasPermissoes = Object.values(permissoes)
          .filter(p => p.pode_visualizar || p.pode_criar || p.pode_editar || p.pode_excluir)
          .map(p => ({
            perfil_id: perfilSelecionado.id,
            pagina_id: p.pagina_id,
            pode_visualizar: p.pode_visualizar,
            pode_criar: p.pode_criar,
            pode_editar: p.pode_editar,
            pode_excluir: p.pode_excluir
          }))

        if (novasPermissoes.length > 0) {
          await supabase.from('permissoes_perfil').insert(novasPermissoes)
        }

        toast.success(`Permissões do perfil ${perfilSelecionado.nome} salvas!`)
      }
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const atribuirPerfilUsuario = async (usuarioId: string, perfilId: string | null) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ perfil_acesso_id: perfilId || null })
      .eq('id', usuarioId)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Perfil atribuído!')
    carregarDados()
  }

  const copiarPermissoesDe = async (usuarioOrigem: Usuario) => {
    if (!usuarioSelecionado) return

    const { data: permissoesOrigem } = await supabase
      .from('permissoes_usuario')
      .select('*')
      .eq('usuario_id', usuarioOrigem.id)

    const permissoesMap: Record<string, Permissao> = {}
    ;(permissoesOrigem || []).forEach(p => {
      permissoesMap[p.pagina_id] = {
        pagina_id: p.pagina_id,
        pode_visualizar: p.pode_visualizar,
        pode_criar: p.pode_criar,
        pode_editar: p.pode_editar,
        pode_excluir: p.pode_excluir
      }
    })

    setPermissoes(permissoesMap)
    toast.success(`Permissões copiadas de ${usuarioOrigem.nome}`)
  }

  const toggleExpandido = (id: string) => {
    setExpandidos(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-red-300">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Apenas administradores podem gerenciar permissões.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Gerenciamento de Permissões
          </h1>
          <p className="text-muted-foreground">Configure o acesso de cada usuário às páginas do sistema</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'usuarios' ? 'default' : 'outline'} onClick={() => setTab('usuarios')}>
          <Users className="h-4 w-4 mr-2" />
          Por Usuário
        </Button>
        <Button variant={tab === 'perfis' ? 'default' : 'outline'} onClick={() => setTab('perfis')}>
          <UserCog className="h-4 w-4 mr-2" />
          Por Perfil
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{tab === 'usuarios' ? 'Usuários' : 'Perfis de Acesso'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tab === 'usuarios' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar usuário..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : (
                    usuariosFiltrados.map(u => (
                      <div
                        key={u.id}
                        onClick={() => carregarPermissoesUsuario(u)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          usuarioSelecionado?.id === u.id ? 'bg-purple-100 border-2 border-purple-500' : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium flex items-center gap-2">
                          {u.nome}
                          {u.is_admin && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Admin</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                        {u.perfil && <div className="text-xs text-purple-600 mt-1">Perfil: {u.perfil.nome}</div>}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {tab === 'perfis' && (
              <div className="space-y-1">
                {perfis.map(p => (
                  <div
                    key={p.id}
                    onClick={() => carregarPermissoesPerfil(p)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      perfilSelecionado?.id === p.id ? 'bg-purple-100 border-2 border-purple-500' : 'hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{p.nome}</div>
                    <div className="text-sm text-muted-foreground">{p.descricao}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {usuarioSelecionado ? `Permissões de ${usuarioSelecionado.nome}` : perfilSelecionado ? `Permissões do Perfil ${perfilSelecionado.nome}` : 'Selecione um usuário ou perfil'}
              </CardTitle>
              {(usuarioSelecionado || perfilSelecionado) && (
                <Button onClick={salvarPermissoes} disabled={salvando} className="bg-green-600 hover:bg-green-700">
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Permissões
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {usuarioSelecionado && tab === 'usuarios' && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">Perfil de Acesso:</span>
                <select
                  value={usuarioSelecionado.perfil_acesso_id || ''}
                  onChange={e => atribuirPerfilUsuario(usuarioSelecionado.id, e.target.value || null)}
                  className="h-9 px-3 border rounded-md"
                >
                  <option value="">Sem perfil (permissões individuais)</option>
                  {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <span className="text-sm text-muted-foreground">|</span>
                <span className="text-sm">Copiar de:</span>
                <select
                  onChange={e => { const user = usuarios.find(u => u.id === e.target.value); if (user) copiarPermissoesDe(user) }}
                  className="h-9 px-3 border rounded-md"
                  defaultValue=""
                >
                  <option value="">Selecione...</option>
                  {usuarios.filter(u => u.id !== usuarioSelecionado.id).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            )}

            {(usuarioSelecionado || perfilSelecionado) ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Página</th>
                      <th className="text-center p-3 font-medium w-20"><div className="flex flex-col items-center"><Eye className="h-4 w-4" /><span className="text-xs">Ver</span></div></th>
                      <th className="text-center p-3 font-medium w-20"><div className="flex flex-col items-center"><Plus className="h-4 w-4" /><span className="text-xs">Criar</span></div></th>
                      <th className="text-center p-3 font-medium w-20"><div className="flex flex-col items-center"><Edit className="h-4 w-4" /><span className="text-xs">Editar</span></div></th>
                      <th className="text-center p-3 font-medium w-20"><div className="flex flex-col items-center"><Trash2 className="h-4 w-4" /><span className="text-xs">Excluir</span></div></th>
                      <th className="text-center p-3 font-medium w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginas.map(pagina => (
                      <>
                        <tr key={pagina.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {pagina.subpaginas && pagina.subpaginas.length > 0 && (
                                <button onClick={() => toggleExpandido(pagina.id)} className="p-1 hover:bg-gray-200 rounded">
                                  {expandidos.has(pagina.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
                              <span className="font-medium">{pagina.nome}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{pagina.descricao}</span>
                          </td>
                          <td className="text-center p-3">
                            <button onClick={() => togglePermissao(pagina.id, 'pode_visualizar')} className={`p-2 rounded ${permissoes[pagina.id]?.pode_visualizar ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {permissoes[pagina.id]?.pode_visualizar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="text-center p-3">
                            <button onClick={() => togglePermissao(pagina.id, 'pode_criar')} className={`p-2 rounded ${permissoes[pagina.id]?.pode_criar ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              {permissoes[pagina.id]?.pode_criar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="text-center p-3">
                            <button onClick={() => togglePermissao(pagina.id, 'pode_editar')} className={`p-2 rounded ${permissoes[pagina.id]?.pode_editar ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                              {permissoes[pagina.id]?.pode_editar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="text-center p-3">
                            <button onClick={() => togglePermissao(pagina.id, 'pode_excluir')} className={`p-2 rounded ${permissoes[pagina.id]?.pode_excluir ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                              {permissoes[pagina.id]?.pode_excluir ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="text-center p-3">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => marcarTodos(pagina.id, true)} className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200">Todos</button>
                              <button onClick={() => marcarTodos(pagina.id, false)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Nenhum</button>
                            </div>
                          </td>
                        </tr>
                        
                        {expandidos.has(pagina.id) && pagina.subpaginas?.map(sub => (
                          <tr key={sub.id} className="border-t bg-gray-50/50 hover:bg-gray-100">
                            <td className="p-3 pl-12">
                              <span className="text-sm">↳ {sub.nome}</span>
                              <span className="text-xs text-muted-foreground ml-2">{sub.descricao}</span>
                            </td>
                            <td className="text-center p-3">
                              <button onClick={() => togglePermissao(sub.id, 'pode_visualizar')} className={`p-2 rounded ${permissoes[sub.id]?.pode_visualizar ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {permissoes[sub.id]?.pode_visualizar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="text-center p-3">
                              <button onClick={() => togglePermissao(sub.id, 'pode_criar')} className={`p-2 rounded ${permissoes[sub.id]?.pode_criar ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                {permissoes[sub.id]?.pode_criar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="text-center p-3">
                              <button onClick={() => togglePermissao(sub.id, 'pode_editar')} className={`p-2 rounded ${permissoes[sub.id]?.pode_editar ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                                {permissoes[sub.id]?.pode_editar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="text-center p-3">
                              <button onClick={() => togglePermissao(sub.id, 'pode_excluir')} className={`p-2 rounded ${permissoes[sub.id]?.pode_excluir ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                {permissoes[sub.id]?.pode_excluir ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="text-center p-3">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => marcarTodos(sub.id, true)} className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200">Todos</button>
                                <button onClick={() => marcarTodos(sub.id, false)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Nenhum</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Selecione um usuário ou perfil para configurar as permissões</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
