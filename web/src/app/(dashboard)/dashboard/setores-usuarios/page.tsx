'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { PaginaProtegida } from '@/components/ui/permissao'
import { 
  Users, Folder, Check, X, RefreshCw, Save, ChevronDown, ChevronUp,
  Eye, MessageSquare, ArrowRightLeft
} from 'lucide-react'

type Usuario = {
  id: string
  auth_id: string
  nome: string
  email: string
  is_admin: boolean
}

type Setor = {
  id: string
  nome: string
  cor: string
  icone: string
}

type UsuarioSetor = {
  user_id: string
  setor_id: string
  pode_ver: boolean
  pode_responder: boolean
  pode_transferir: boolean
}

export default function SetoresUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [associacoes, setAssociacoes] = useState<UsuarioSetor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar usuários (não admins)
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('id, auth_id, nome, email, is_admin')
        .eq('ativo', true)
        .order('nome')

      // Buscar setores
      const { data: setoresData } = await supabase
        .from('setores_whatsapp')
        .select('id, nome, cor, icone')
        .eq('ativo', true)
        .order('ordem')

      // Buscar associações existentes
      const { data: associacoesData } = await supabase
        .from('usuarios_setores_whatsapp')
        .select('user_id, setor_id, pode_ver, pode_responder, pode_transferir')

      setUsuarios(usuariosData || [])
      setSetores(setoresData || [])
      setAssociacoes(associacoesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Verificar se usuário tem setor
  const getAssociacao = (userId: string, setorId: string): UsuarioSetor | undefined => {
    return associacoes.find(a => a.user_id === userId && a.setor_id === setorId)
  }

  // Toggle setor para usuário
  const toggleSetor = (userId: string, setorId: string) => {
    const existente = getAssociacao(userId, setorId)
    
    if (existente) {
      // Remover
      setAssociacoes(prev => prev.filter(a => !(a.user_id === userId && a.setor_id === setorId)))
    } else {
      // Adicionar com permissões padrão
      setAssociacoes(prev => [...prev, {
        user_id: userId,
        setor_id: setorId,
        pode_ver: true,
        pode_responder: true,
        pode_transferir: false
      }])
    }
  }

  // Toggle permissão específica
  const togglePermissao = (userId: string, setorId: string, permissao: 'pode_ver' | 'pode_responder' | 'pode_transferir') => {
    setAssociacoes(prev => prev.map(a => {
      if (a.user_id === userId && a.setor_id === setorId) {
        return { ...a, [permissao]: !a[permissao] }
      }
      return a
    }))
  }

  // Salvar alterações
  const salvarAlteracoes = async () => {
    setSaving(true)
    try {
      // Para cada usuário, deletar suas associações antigas e inserir as novas
      for (const usuario of usuarios) {
        // Deletar associações antigas
        await supabase
          .from('usuarios_setores_whatsapp')
          .delete()
          .eq('user_id', usuario.auth_id)

        // Inserir novas associações
        const associacoesUsuario = associacoes.filter(a => a.user_id === usuario.auth_id)
        if (associacoesUsuario.length > 0) {
          await supabase
            .from('usuarios_setores_whatsapp')
            .insert(associacoesUsuario)
        }
      }

      toast.success('Permissões salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Contar setores do usuário
  const contarSetores = (userId: string): number => {
    return associacoes.filter(a => a.user_id === userId).length
  }

  if (loading) {
    return (
      <PaginaProtegida codigoPagina="configuracoes">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PaginaProtegida>
    )
  }

  return (
    <PaginaProtegida codigoPagina="configuracoes">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Setores por Usuário</h1>
            <p className="text-muted-foreground">Configure quais setores cada atendente pode ver e responder no CRM</p>
          </div>
          <Button onClick={salvarAlteracoes} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>

        {/* Legenda */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Legenda de Permissões</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span><strong>Ver:</strong> Pode visualizar conversas do setor</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span><strong>Responder:</strong> Pode enviar mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-orange-500" />
              <span><strong>Transferir:</strong> Pode transferir para outros setores</span>
            </div>
          </div>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-3">
          {usuarios.filter(u => !u.is_admin).map((usuario) => (
            <Card key={usuario.id} className="overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandido(expandido === usuario.id ? null : usuario.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium">{usuario.nome}</p>
                    <p className="text-sm text-muted-foreground">{usuario.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {contarSetores(usuario.auth_id)} setor(es)
                  </span>
                  {expandido === usuario.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Setores expandidos */}
              {expandido === usuario.id && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {setores.map((setor) => {
                      const associacao = getAssociacao(usuario.auth_id, setor.id)
                      const ativo = !!associacao

                      return (
                        <div 
                          key={setor.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            ativo 
                              ? 'border-green-500 bg-white' 
                              : 'border-gray-200 bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: setor.cor + '20', color: setor.cor }}
                              >
                                <Folder className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{setor.nome}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSetor(usuario.auth_id, setor.id)
                              }}
                              className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                                ativo 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                              }`}
                            >
                              {ativo ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* Permissões detalhadas */}
                          {ativo && (
                            <div className="flex gap-2 mt-2 pt-2 border-t">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePermissao(usuario.auth_id, setor.id, 'pode_ver')
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
                                  associacao?.pode_ver 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                                title="Ver conversas"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePermissao(usuario.auth_id, setor.id, 'pode_responder')
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
                                  associacao?.pode_responder 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                                title="Responder mensagens"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Resp
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePermissao(usuario.auth_id, setor.id, 'pode_transferir')
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
                                  associacao?.pode_transferir 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                                title="Transferir conversas"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                Transf
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Usuários Admin */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Administradores</p>
                <p className="text-sm text-blue-700">
                  {usuarios.filter(u => u.is_admin).map(u => u.nome).join(', ') || 'Nenhum'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Administradores têm acesso automático a todos os setores
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PaginaProtegida>
  )
}
