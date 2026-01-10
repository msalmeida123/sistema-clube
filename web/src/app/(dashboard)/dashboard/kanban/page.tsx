'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { PaginaProtegida } from '@/components/ui/permissao'
import { 
  MessageSquare, User, Phone, Clock, AlertCircle, CheckCircle2,
  Filter, RefreshCw, Loader2, Building2, MoreVertical, Inbox,
  ShoppingCart, LifeBuoy, DollarSign, Briefcase, Folder, PlayCircle,
  PauseCircle, XCircle
} from 'lucide-react'
import Link from 'next/link'

type Setor = {
  id: string
  nome: string
  cor: string
  icone: string
}

type Conversa = {
  id: string
  telefone: string
  nome_contato: string | null
  ultimo_contato: string | null
  ultima_mensagem: string | null
  status: string
  setor_id: string | null
  prioridade: string
  status_kanban: string
  ordem_kanban: number
  responsavel_id: string | null
  nao_lidas: number
  foto_perfil_url: string | null
  setor?: Setor
}

// Colunas do Kanban na ordem correta de um fluxo de atendimento
const COLUNAS_KANBAN = [
  { id: 'novo', nome: 'Novos', cor: 'bg-blue-500', icon: Inbox, descricao: 'Contatos novos aguardando primeiro atendimento' },
  { id: 'em_atendimento', nome: 'Em Atendimento', cor: 'bg-purple-500', icon: PlayCircle, descricao: 'Conversas sendo atendidas atualmente' },
  { id: 'aguardando_cliente', nome: 'Aguardando Cliente', cor: 'bg-yellow-500', icon: Clock, descricao: 'Aguardando resposta do cliente' },
  { id: 'aguardando_interno', nome: 'Aguardando Interno', cor: 'bg-orange-500', icon: PauseCircle, descricao: 'Pendente de ação interna/aprovação' },
  { id: 'resolvido', nome: 'Resolvido', cor: 'bg-green-500', icon: CheckCircle2, descricao: 'Atendimento concluído com sucesso' },
  { id: 'cancelado', nome: 'Cancelado', cor: 'bg-gray-500', icon: XCircle, descricao: 'Atendimento cancelado ou sem resposta' },
]

const PRIORIDADES = [
  { id: 'baixa', nome: 'Baixa', cor: 'bg-gray-400', ordem: 4 },
  { id: 'media', nome: 'Média', cor: 'bg-blue-400', ordem: 3 },
  { id: 'alta', nome: 'Alta', cor: 'bg-orange-500', ordem: 2 },
  { id: 'urgente', nome: 'Urgente', cor: 'bg-red-500', ordem: 1 },
]

// Mapeamento de ícones para os setores
const iconesSetor: Record<string, React.ReactNode> = {
  'inbox': <Inbox className="h-3 w-3" />,
  'shopping-cart': <ShoppingCart className="h-3 w-3" />,
  'life-buoy': <LifeBuoy className="h-3 w-3" />,
  'dollar-sign': <DollarSign className="h-3 w-3" />,
  'briefcase': <Briefcase className="h-3 w-3" />,
  'folder': <Folder className="h-3 w-3" />,
}

export default function KanbanPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [setorFiltro, setSetorFiltro] = useState<string>('todos')
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>('todas')
  const [dragging, setDragging] = useState<string | null>(null)
  const [showFiltros, setShowFiltros] = useState(false)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true)
    
    // Carregar setores do WhatsApp
    const { data: setoresData } = await supabase
      .from('setores_whatsapp')
      .select('id, nome, cor, icone')
      .eq('ativo', true)
      .order('ordem')
    
    setSetores(setoresData || [])

    // Carregar conversas
    let query = supabase
      .from('conversas_whatsapp')
      .select('*')
      .order('ordem_kanban', { ascending: true })

    if (setorFiltro !== 'todos') {
      if (setorFiltro === 'sem_setor') {
        query = query.is('setor_id', null)
      } else {
        query = query.eq('setor_id', setorFiltro)
      }
    }

    if (prioridadeFiltro !== 'todas') {
      query = query.eq('prioridade', prioridadeFiltro)
    }

    const { data: conversasData } = await query

    // Mapear setores às conversas
    const conversasComSetor = (conversasData || []).map(c => ({
      ...c,
      setor: setoresData?.find(s => s.id === c.setor_id) || null
    }))

    setConversas(conversasComSetor)
    setLoading(false)
  }, [setorFiltro, prioridadeFiltro, supabase])

  useEffect(() => {
    carregarDados()

    // Realtime
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversas_whatsapp'
      }, () => {
        carregarDados()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [carregarDados, supabase])

  // Mover conversa para outra coluna com ordem
  const moverConversa = async (conversaId: string, novoStatus: string, novaOrdem?: number) => {
    // Calcular nova ordem se não fornecida (vai para o topo)
    if (novaOrdem === undefined) {
      const conversasColuna = conversas.filter(c => (c.status_kanban || 'novo') === novoStatus)
      novaOrdem = conversasColuna.length > 0 
        ? Math.min(...conversasColuna.map(c => c.ordem_kanban)) - 1 
        : 0
    }

    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ 
        status_kanban: novoStatus,
        ordem_kanban: novaOrdem 
      })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao mover conversa')
      return
    }

    // Atualizar estado local imediatamente
    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, status_kanban: novoStatus, ordem_kanban: novaOrdem! } : c
    ))
  }

  // Reordenar dentro da mesma coluna
  const reordenarConversa = async (conversaId: string, novaOrdem: number) => {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ ordem_kanban: novaOrdem })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao reordenar')
      return
    }

    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, ordem_kanban: novaOrdem } : c
    ))
  }

  // Alterar prioridade
  const alterarPrioridade = async (conversaId: string, novaPrioridade: string) => {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ prioridade: novaPrioridade })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao alterar prioridade')
      return
    }

    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, prioridade: novaPrioridade } : c
    ))
    setMenuAberto(null)
    toast.success('Prioridade alterada!')
  }

  // Atribuir setor
  const atribuirSetor = async (conversaId: string, setorId: string | null) => {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ setor_id: setorId })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao atribuir setor')
      return
    }

    carregarDados()
    setMenuAberto(null)
    toast.success('Setor atribuído!')
  }

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, conversaId: string) => {
    setDragging(conversaId)
    e.dataTransfer.setData('conversaId', conversaId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, statusKanban: string) => {
    e.preventDefault()
    const conversaId = e.dataTransfer.getData('conversaId')
    if (conversaId) {
      moverConversa(conversaId, statusKanban)
    }
    setDragging(null)
  }

  const handleDragEnd = () => {
    setDragging(null)
  }

  // Formatar data
  const formatarData = (data: string | null) => {
    if (!data) return ''
    const d = new Date(data)
    const agora = new Date()
    const diff = agora.getTime() - d.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)

    if (minutos < 60) return `${minutos}min`
    if (horas < 24) return `${horas}h`
    if (dias < 7) return `${dias}d`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Obter cor da prioridade
  const getCorPrioridade = (prioridade: string) => {
    return PRIORIDADES.find(p => p.id === prioridade)?.cor || 'bg-gray-400'
  }

  // Filtrar e ordenar conversas por coluna
  const getConversasColuna = (statusKanban: string) => {
    return conversas
      .filter(c => (c.status_kanban || 'novo') === statusKanban)
      .sort((a, b) => {
        // Primeiro por prioridade (urgente primeiro)
        const prioA = PRIORIDADES.find(p => p.id === a.prioridade)?.ordem || 3
        const prioB = PRIORIDADES.find(p => p.id === b.prioridade)?.ordem || 3
        if (prioA !== prioB) return prioA - prioB
        
        // Depois por ordem do kanban
        return a.ordem_kanban - b.ordem_kanban
      })
  }

  // Contagem total por status
  const getContagem = () => {
    const contagem: Record<string, number> = {}
    COLUNAS_KANBAN.forEach(col => {
      contagem[col.id] = conversas.filter(c => (c.status_kanban || 'novo') === col.id).length
    })
    return contagem
  }

  const contagem = getContagem()

  return (
    <PaginaProtegida codigoPagina="kanban">
    <div className="h-[calc(100vh-80px)] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Kanban de Atendimento</h1>
          <p className="text-muted-foreground">
            Arraste os cards entre as colunas para atualizar o status • 
            <span className="ml-2 font-medium">{conversas.length} conversas</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFiltros(!showFiltros)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {(setorFiltro !== 'todos' || prioridadeFiltro !== 'todas') && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {(setorFiltro !== 'todos' ? 1 : 0) + (prioridadeFiltro !== 'todas' ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={carregarDados} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/dashboard/crm">
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              CRM
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Setor</label>
              <select
                value={setorFiltro}
                onChange={(e) => setSetorFiltro(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm min-w-[150px]"
              >
                <option value="todos">Todos os setores</option>
                <option value="sem_setor">Sem setor</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Prioridade</label>
              <select
                value={prioridadeFiltro}
                onChange={(e) => setPrioridadeFiltro(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm min-w-[150px]"
              >
                <option value="todas">Todas</option>
                {PRIORIDADES.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setSetorFiltro('todos'); setPrioridadeFiltro('todas') }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Resumo das Colunas */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {COLUNAS_KANBAN.map((coluna) => {
          const Icon = coluna.icon
          return (
            <div
              key={coluna.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm ${coluna.cor}`}
            >
              <Icon className="h-4 w-4" />
              <span>{coluna.nome}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                {contagem[coluna.id] || 0}
              </span>
            </div>
          )
        })}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
          {COLUNAS_KANBAN.map((coluna) => {
            const conversasColuna = getConversasColuna(coluna.id)
            const Icon = coluna.icon

            return (
              <div
                key={coluna.id}
                className={`flex-shrink-0 w-72 flex flex-col rounded-lg border-2 transition-colors ${
                  dragging ? 'border-dashed border-gray-300' : 'border-transparent'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, coluna.id)}
              >
                {/* Header da Coluna */}
                <div className={`${coluna.cor} text-white px-3 py-2.5 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{coluna.nome}</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {conversasColuna.length}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-1">{coluna.descricao}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 rounded-b-lg min-h-[200px]">
                  {conversasColuna.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma conversa</p>
                      <p className="text-xs">Arraste para cá</p>
                    </div>
                  ) : (
                    conversasColuna.map((conversa, index) => (
                      <Card
                        key={conversa.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, conversa.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 ${
                          dragging === conversa.id ? 'opacity-50 scale-95' : ''
                        }`}
                        style={{ borderLeftColor: getCorPrioridade(conversa.prioridade || 'media').replace('bg-', '#') === 'bg-gray-400' ? '#9ca3af' : 
                          conversa.prioridade === 'urgente' ? '#ef4444' : 
                          conversa.prioridade === 'alta' ? '#f97316' : 
                          conversa.prioridade === 'media' ? '#3b82f6' : '#9ca3af'
                        }}
                      >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              {conversa.foto_perfil_url ? (
                                <AvatarImage src={conversa.foto_perfil_url} />
                              ) : null}
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {conversa.nome_contato?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {conversa.nome_contato || conversa.telefone}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {conversa.telefone}
                              </p>
                            </div>
                          </div>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuAberto(menuAberto === conversa.id ? null : conversa.id)
                              }}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                            
                            {/* Menu Dropdown */}
                            {menuAberto === conversa.id && (
                              <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
                                  Prioridade
                                </div>
                                {PRIORIDADES.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => alterarPrioridade(conversa.id, p.id)}
                                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                      conversa.prioridade === p.id ? 'bg-gray-50' : ''
                                    }`}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${p.cor}`} />
                                    {p.nome}
                                    {conversa.prioridade === p.id && <span className="ml-auto">✓</span>}
                                  </button>
                                ))}
                                <div className="border-t my-1" />
                                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                  Setor
                                </div>
                                <button
                                  onClick={() => atribuirSetor(conversa.id, null)}
                                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${
                                    !conversa.setor_id ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  Sem setor
                                </button>
                                {setores.map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => atribuirSetor(conversa.id, s.id)}
                                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                      conversa.setor_id === s.id ? 'bg-gray-50' : ''
                                    }`}
                                  >
                                    <span style={{ color: s.cor }}>{iconesSetor[s.icone]}</span>
                                    {s.nome}
                                    {conversa.setor_id === s.id && <span className="ml-auto">✓</span>}
                                  </button>
                                ))}
                                <div className="border-t my-1" />
                                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                  Mover para
                                </div>
                                {COLUNAS_KANBAN.filter(c => c.id !== (conversa.status_kanban || 'novo')).map((col) => {
                                  const ColIcon = col.icon
                                  return (
                                    <button
                                      key={col.id}
                                      onClick={() => {
                                        moverConversa(conversa.id, col.id)
                                        setMenuAberto(null)
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <ColIcon className="h-3 w-3" />
                                      {col.nome}
                                    </button>
                                  )
                                })}
                                <div className="border-t my-1" />
                                <Link href={`/dashboard/crm`}>
                                  <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-blue-600">
                                    <MessageSquare className="h-3 w-3" />
                                    Abrir no CRM
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Última mensagem */}
                        {conversa.ultima_mensagem && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 bg-gray-50 p-2 rounded">
                            {conversa.ultima_mensagem}
                          </p>
                        )}

                        {/* Footer do Card */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Badge de prioridade */}
                            <span 
                              className={`text-xs px-1.5 py-0.5 rounded text-white ${getCorPrioridade(conversa.prioridade || 'media')}`}
                            >
                              {PRIORIDADES.find(p => p.id === conversa.prioridade)?.nome || 'Média'}
                            </span>
                            {/* Badge de setor */}
                            {conversa.setor && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{ 
                                  backgroundColor: conversa.setor.cor + '20',
                                  color: conversa.setor.cor 
                                }}
                              >
                                {iconesSetor[conversa.setor.icone]}
                                {conversa.setor.nome}
                              </span>
                            )}
                            {/* Badge não lidas */}
                            {conversa.nao_lidas > 0 && (
                              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                {conversa.nao_lidas}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatarData(conversa.ultimo_contato)}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuAberto && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMenuAberto(null)}
        />
      )}
    </div>
    </PaginaProtegida>
  )
}
