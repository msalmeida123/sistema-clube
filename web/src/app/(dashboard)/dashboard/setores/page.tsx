'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Plus, Pencil, Trash2, Users, Phone, Check, X, Loader2, 
  Building2, UserPlus, UserMinus
} from 'lucide-react'

type Setor = {
  id: string
  nome: string
  descricao: string | null
  cor: string
  telefone_whatsapp: string | null
  ativo: boolean
  created_at: string
}

type Usuario = {
  id: string
  email: string
  nome?: string
}

type UsuarioSetor = {
  id: string
  usuario_id: string
  setor_id: string
  is_responsavel: boolean
  usuario?: Usuario
}

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosSetor, setUsuariosSetor] = useState<UsuarioSetor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showUsuarios, setShowUsuarios] = useState<string | null>(null)
  const [editando, setEditando] = useState<Setor | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    telefone_whatsapp: ''
  })
  
  const supabase = createClientComponentClient()

  // Carregar setores
  const carregarSetores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome')
    
    if (error) {
      toast.error('Erro ao carregar setores')
      console.error(error)
    } else {
      setSetores(data || [])
    }
    setLoading(false)
  }

  // Carregar usuários do sistema
  const carregarUsuarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome')
      .eq('ativo', true)
      .order('nome')
    
    if (!error) {
      setUsuarios(data || [])
    }
  }

  // Carregar usuários de um setor
  const carregarUsuariosSetor = async (setorId: string) => {
    const { data, error } = await supabase
      .from('usuarios_setores')
      .select(`
        *,
        usuario:usuario_id (id, email, nome)
      `)
      .eq('setor_id', setorId)
    
    if (!error) {
      setUsuariosSetor(data || [])
    }
  }

  useEffect(() => {
    carregarSetores()
    carregarUsuarios()
  }, [])

  // Salvar setor
  const salvarSetor = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (editando) {
      const { error } = await supabase
        .from('setores')
        .update({
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor,
          telefone_whatsapp: formData.telefone_whatsapp || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editando.id)

      if (error) {
        toast.error('Erro ao atualizar: ' + error.message)
        return
      }
      toast.success('Setor atualizado!')
    } else {
      const { error } = await supabase
        .from('setores')
        .insert({
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor,
          telefone_whatsapp: formData.telefone_whatsapp || null
        })

      if (error) {
        toast.error('Erro ao criar: ' + error.message)
        return
      }
      toast.success('Setor criado!')
    }

    setShowForm(false)
    setEditando(null)
    setFormData({ nome: '', descricao: '', cor: '#3B82F6', telefone_whatsapp: '' })
    carregarSetores()
  }

  // Excluir setor
  const excluirSetor = async (id: string) => {
    if (!confirm('Excluir este setor? As conversas vinculadas ficarão sem setor.')) return

    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    toast.success('Setor excluído!')
    carregarSetores()
  }

  // Toggle ativo
  const toggleAtivo = async (setor: Setor) => {
    const { error } = await supabase
      .from('setores')
      .update({ ativo: !setor.ativo })
      .eq('id', setor.id)

    if (error) {
      toast.error('Erro ao atualizar')
      return
    }
    carregarSetores()
  }

  // Adicionar usuário ao setor
  const adicionarUsuario = async (usuarioId: string, setorId: string) => {
    const { error } = await supabase
      .from('usuarios_setores')
      .insert({
        usuario_id: usuarioId,
        setor_id: setorId
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('Usuário já está neste setor')
      } else {
        toast.error('Erro ao adicionar: ' + error.message)
      }
      return
    }
    toast.success('Usuário adicionado ao setor!')
    carregarUsuariosSetor(setorId)
  }

  // Remover usuário do setor
  const removerUsuario = async (id: string, setorId: string) => {
    const { error } = await supabase
      .from('usuarios_setores')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao remover')
      return
    }
    toast.success('Usuário removido do setor!')
    carregarUsuariosSetor(setorId)
  }

  // Toggle responsável
  const toggleResponsavel = async (us: UsuarioSetor) => {
    const { error } = await supabase
      .from('usuarios_setores')
      .update({ is_responsavel: !us.is_responsavel })
      .eq('id', us.id)

    if (error) {
      toast.error('Erro ao atualizar')
      return
    }
    carregarUsuariosSetor(us.setor_id)
  }

  // Abrir form de edição
  const abrirEdicao = (setor: Setor) => {
    setEditando(setor)
    setFormData({
      nome: setor.nome,
      descricao: setor.descricao || '',
      cor: setor.cor,
      telefone_whatsapp: setor.telefone_whatsapp || ''
    })
    setShowForm(true)
  }

  // Abrir modal de usuários
  const abrirUsuarios = (setorId: string) => {
    setShowUsuarios(setorId)
    carregarUsuariosSetor(setorId)
  }

  const cores = [
    '#22C55E', '#3B82F6', '#8B5CF6', '#EAB308', 
    '#EF4444', '#F97316', '#EC4899', '#14B8A6'
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Setores
          </h1>
          <p className="text-muted-foreground">
            Configure os setores para direcionar as conversas do WhatsApp
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditando(null); setFormData({ nome: '', descricao: '', cor: '#3B82F6', telefone_whatsapp: '' }) }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : setores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum setor cadastrado</p>
            <p className="text-muted-foreground mb-4">Crie setores para organizar as conversas</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Setor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setores.map((setor) => (
            <Card key={setor.id} className={`relative ${!setor.ativo ? 'opacity-60' : ''}`}>
              <div 
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: setor.cor }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: setor.cor }}
                    />
                    <CardTitle className="text-lg">{setor.nome}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => abrirUsuarios(setor.id)}
                      title="Gerenciar usuários"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => abrirEdicao(setor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => excluirSetor(setor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {setor.descricao && (
                  <p className="text-sm text-muted-foreground mb-3">{setor.descricao}</p>
                )}
                {setor.telefone_whatsapp && (
                  <p className="text-sm flex items-center gap-1 mb-3">
                    <Phone className="h-3 w-3" />
                    {setor.telefone_whatsapp}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className={`text-xs px-2 py-1 rounded-full ${setor.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {setor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleAtivo(setor)}
                  >
                    {setor.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editando ? 'Editar Setor' : 'Novo Setor'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  placeholder="Ex: Atendimento, Financeiro..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descrição do setor"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone WhatsApp do Setor</label>
                <Input
                  placeholder="Ex: 16999998888"
                  value={formData.telefone_whatsapp}
                  onChange={(e) => setFormData({ ...formData, telefone_whatsapp: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número que receberá as mensagens deste setor
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2 mt-2">
                  {cores.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${formData.cor === cor ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: cor }}
                      onClick={() => setFormData({ ...formData, cor })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setShowForm(false); setEditando(null) }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={salvarSetor}>
                  {editando ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Usuários do Setor */}
      {showUsuarios && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários do Setor
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUsuarios(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Usuários atuais */}
              <div>
                <h3 className="font-medium mb-2">Membros ({usuariosSetor.length})</h3>
                {usuariosSetor.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário neste setor</p>
                ) : (
                  <div className="space-y-2">
                    {usuariosSetor.map((us) => (
                      <div key={us.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{(us.usuario as any)?.nome || (us.usuario as any)?.email}</p>
                          <p className="text-xs text-muted-foreground">{(us.usuario as any)?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={us.is_responsavel ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleResponsavel(us)}
                          >
                            {us.is_responsavel ? '⭐ Responsável' : 'Tornar Responsável'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removerUsuario(us.id, us.setor_id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar usuário */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Adicionar Usuário</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {usuarios
                    .filter(u => !usuariosSetor.some(us => us.usuario_id === u.id))
                    .map((usuario) => (
                      <div key={usuario.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{usuario.nome || usuario.email}</p>
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adicionarUsuario(usuario.id, showUsuarios)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  {usuarios.filter(u => !usuariosSetor.some(us => us.usuario_id === u.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Todos os usuários já estão neste setor
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
