'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  MessageSquare, User, Phone, Clock, AlertCircle, CheckCircle2,
  ArrowRight, Filter, RefreshCw, Loader2, ChevronDown, Building2,
  Flag, UserCheck, Calendar, MoreVertical
} from 'lucide-react'
import Link from 'next/link'

type Setor = {
  id: string
  nome: string
  cor: string
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
  responsavel_id: string | null
  nao_lidas: number
  setor?: Setor
}

const COLUNAS_KANBAN = [
  { id: 'novo', nome: 'Novos', cor: 'bg-blue-500', icon: MessageSquare },
  { id: 'aguardando', nome: 'Aguardando Resposta', cor: 'bg-yellow-500', icon: Clock },
  { id: 'em_atendimento', nome: 'Em Atendimento', cor: 'bg-purple-500', icon: UserCheck },
  { id: 'pendente', nome: 'Pendente', cor: 'bg-orange-500', icon: AlertCircle },
  { id: 'resolvido', nome: 'Resolvido', cor: 'bg-green-500', icon: CheckCircle2 },
]

const PRIORIDADES = [
  { id: 'baixa', nome: 'Baixa', cor: 'bg-gray-400' },
  { id: 'media', nome: 'Média', cor: 'bg-blue-400' },
  { id: 'alta', nome: 'Alta', cor: 'bg-orange-500' },
  { id: 'urgente', nome: 'Urgente', cor: 'bg-red-500' },
]

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
    
    // Carregar setores
    const { data: setoresData } = await supabase
      .from('setores')
      .select('id, nome, cor')
      .eq('ativo', true)
      .order('nome')
    
    setSetores(setoresData || [])

    // Carregar conversas
    let query = supabase
      .from('conversas_whatsapp')
      .select(`
        *,
        setor:setor_id (id, nome, cor)
      `)
      .order('ultimo_contato', { ascending: false })

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
    setConversas(conversasData || [])
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

  // Mover conversa para outra coluna
  const moverConversa = async (conversaId: string, novoStatus: string) => {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ status_kanban: novoStatus })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao mover conversa')
      return
    }

    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, status_kanban: novoStatus } : c
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
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, statusKanban: string) => {
    e.preventDefault()
    const conversaId = e.dataTransfer.getData('conversaId')
    if (conversaId) {
      moverConversa(conversaId, statusKanban)
    }
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

  // Filtrar conversas por coluna
  const getConversasColuna = (statusKanban: string) => {
    return conversas.filter(c => (c.status_kanban || 'novo') === statusKanban)
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Kanban de Atendimento</h1>
          <p className="text-muted-foreground">Gerencie as conversas por status e prioridade</p>
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
          <Link href="/dashboard/setores">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Setores
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

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUNAS_KANBAN.map((coluna) => {
            const conversasColuna = getConversasColuna(coluna.id)
            const Icon = coluna.icon

            return (
              <div
                key={coluna.id}
                className="flex-shrink-0 w-80 flex flex-col bg-gray-100 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, coluna.id)}
              >
                {/* Header da Coluna */}
                <div className={`${coluna.cor} text-white px-4 py-3 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{coluna.nome}</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                      {conversasColuna.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {conversasColuna.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma conversa
                    </div>
                  ) : (
                    conversasColuna.map((conversa) => (
                      <Card
                        key={conversa.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, conversa.id)}
                        className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                          dragging === conversa.id ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {conversa.nome_contato?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">
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
                              onClick={() => setMenuAberto(menuAberto === conversa.id ? null : conversa.id)}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                            
                            {/* Menu Dropdown */}
                            {menuAberto === conversa.id && (
                              <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
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
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.cor }} />
                                    {s.nome}
                                    {conversa.setor_id === s.id && <span className="ml-auto">✓</span>}
                                  </button>
                                ))}
                                <div className="border-t my-1" />
                                <Link href={`/dashboard/crm?conversa=${conversa.id}`}>
                                  <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" />
                                    Abrir conversa
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Última mensagem */}
                        {conversa.ultima_mensagem && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {conversa.ultima_mensagem}
                          </p>
                        )}

                        {/* Footer do Card */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {/* Badge de prioridade */}
                            <div 
                              className={`w-2 h-2 rounded-full ${getCorPrioridade(conversa.prioridade || 'media')}`}
                              title={PRIORIDADES.find(p => p.id === conversa.prioridade)?.nome || 'Média'}
                            />
                            {/* Badge de setor */}
                            {conversa.setor && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: conversa.setor.cor + '20',
                                  color: conversa.setor.cor 
                                }}
                              >
                                {conversa.setor.nome}
                              </span>
                            )}
                            {/* Badge não lidas */}
                            {conversa.nao_lidas > 0 && (
                              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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
          className="fixed inset-0 z-0" 
          onClick={() => setMenuAberto(null)}
        />
      )}
    </div>
  )
}
