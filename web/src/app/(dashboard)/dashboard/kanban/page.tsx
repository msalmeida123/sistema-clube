'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { PaginaProtegida } from '@/components/ui/permissao'
import { 
  MessageSquare, User, Phone, Clock, AlertCircle, CheckCircle2,
  Filter, RefreshCw, Loader2, MoreVertical, Inbox,
  ShoppingCart, LifeBuoy, DollarSign, Briefcase, Folder, PlayCircle,
  PauseCircle, XCircle, GripVertical
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
  { id: 'novo', nome: 'Novos', cor: 'bg-blue-500', icon: Inbox, descricao: 'Aguardando primeiro atendimento' },
  { id: 'em_atendimento', nome: 'Em Atendimento', cor: 'bg-purple-500', icon: PlayCircle, descricao: 'Sendo atendido agora' },
  { id: 'aguardando_cliente', nome: 'Aguardando Cliente', cor: 'bg-yellow-500', icon: Clock, descricao: 'Aguardando resposta' },
  { id: 'aguardando_interno', nome: 'Aguardando Interno', cor: 'bg-orange-500', icon: PauseCircle, descricao: 'Pendente aprovação' },
  { id: 'resolvido', nome: 'Resolvido', cor: 'bg-green-500', icon: CheckCircle2, descricao: 'Concluído com sucesso' },
  { id: 'cancelado', nome: 'Cancelado', cor: 'bg-gray-500', icon: XCircle, descricao: 'Sem resposta/cancelado' },
]

const PRIORIDADES = [
  { id: 'urgente', nome: 'Urgente', cor: 'bg-red-500', textCor: 'text-red-500', borderCor: 'border-red-500', ordem: 1 },
  { id: 'alta', nome: 'Alta', cor: 'bg-orange-500', textCor: 'text-orange-500', borderCor: 'border-orange-500', ordem: 2 },
  { id: 'media', nome: 'Média', cor: 'bg-blue-400', textCor: 'text-blue-400', borderCor: 'border-blue-400', ordem: 3 },
  { id: 'baixa', nome: 'Baixa', cor: 'bg-gray-400', textCor: 'text-gray-400', borderCor: 'border-gray-400', ordem: 4 },
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
  const [showFiltros, setShowFiltros] = useState(false)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  
  // Estado do drag and drop
  const [draggedItem, setDraggedItem] = useState<Conversa | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
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
      status_kanban: c.status_kanban || 'novo',
      prioridade: c.prioridade || 'media',
      ordem_kanban: c.ordem_kanban || 0,
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

  // Obter conversas ordenadas de uma coluna
  const getConversasColuna = useCallback((statusKanban: string) => {
    return conversas
      .filter(c => c.status_kanban === statusKanban)
      .sort((a, b) => {
        // Primeiro por prioridade (urgente primeiro)
        const prioA = PRIORIDADES.find(p => p.id === a.prioridade)?.ordem || 3
        const prioB = PRIORIDADES.find(p => p.id === b.prioridade)?.ordem || 3
        if (prioA !== prioB) return prioA - prioB
        // Depois por ordem manual
        return (a.ordem_kanban || 0) - (b.ordem_kanban || 0)
      })
  }, [conversas])

  // Atualizar ordem das conversas no banco
  const atualizarOrdem = async (conversaId: string, novoStatus: string, novaOrdem: number) => {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ 
        status_kanban: novoStatus,
        ordem_kanban: novaOrdem 
      })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao mover conversa')
      console.error(error)
      return false
    }
    return true
  }

  // Reordenar múltiplas conversas
  const reordenarConversas = async (conversasParaAtualizar: { id: string, ordem_kanban: number }[]) => {
    for (const conv of conversasParaAtualizar) {
      await supabase
        .from('conversas_whatsapp')
        .update({ ordem_kanban: conv.ordem_kanban })
        .eq('id', conv.id)
    }
  }

  // Drag Start
  const handleDragStart = (e: React.DragEvent, conversa: Conversa) => {
    setDraggedItem(conversa)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', conversa.id)
    
    // Adicionar classe visual
    const target = e.target as HTMLElement
    setTimeout(() => {
      target.style.opacity = '0.5'
    }, 0)
  }

  // Drag End
  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.style.opacity = '1'
    setDraggedItem(null)
    setDragOverColumn(null)
    setDragOverIndex(null)
  }

  // Drag Over na coluna
  const handleDragOverColumn = (e: React.DragEvent, colunaId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(colunaId)
  }

  // Drag Over em um card específico (para inserir antes/depois)
  const handleDragOverCard = (e: React.DragEvent, colunaId: string, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const insertIndex = e.clientY < midY ? index : index + 1
    
    setDragOverColumn(colunaId)
    setDragOverIndex(insertIndex)
  }

  // Drop
  const handleDrop = async (e: React.DragEvent, colunaId: string, dropIndex?: number) => {
    e.preventDefault()
    
    if (!draggedItem) return

    const conversasDestino = getConversasColuna(colunaId)
    const indexDestino = dropIndex !== undefined ? dropIndex : conversasDestino.length

    // Se está movendo para a mesma coluna
    if (draggedItem.status_kanban === colunaId) {
      const indexOrigem = conversasDestino.findIndex(c => c.id === draggedItem.id)
      if (indexOrigem === indexDestino || indexOrigem === indexDestino - 1) {
        // Não mudou de posição
        setDraggedItem(null)
        setDragOverColumn(null)
        setDragOverIndex(null)
        return
      }

      // Reordenar dentro da coluna
      const novaLista = [...conversasDestino]
      novaLista.splice(indexOrigem, 1)
      const finalIndex = indexOrigem < indexDestino ? indexDestino - 1 : indexDestino
      novaLista.splice(finalIndex, 0, draggedItem)

      // Atualizar ordem de todas as conversas da coluna
      const atualizacoes = novaLista.map((c, i) => ({ id: c.id, ordem_kanban: i * 10 }))
      
      // Atualizar estado local imediatamente
      setConversas(prev => {
        const outras = prev.filter(c => c.status_kanban !== colunaId)
        const atualizadas = novaLista.map((c, i) => ({ ...c, ordem_kanban: i * 10 }))
        return [...outras, ...atualizadas]
      })

      // Persistir no banco
      await reordenarConversas(atualizacoes)
      
    } else {
      // Movendo para outra coluna
      const novaOrdem = indexDestino * 10

      // Atualizar estado local imediatamente
      setConversas(prev => prev.map(c => 
        c.id === draggedItem.id 
          ? { ...c, status_kanban: colunaId, ordem_kanban: novaOrdem }
          : c
      ))

      // Persistir no banco
      const sucesso = await atualizarOrdem(draggedItem.id, colunaId, novaOrdem)
      
      if (sucesso) {
        toast.success(`Movido para ${COLUNAS_KANBAN.find(c => c.id === colunaId)?.nome}`)
      }
    }

    setDraggedItem(null)
    setDragOverColumn(null)
    setDragOverIndex(null)
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

    const setor = setores.find(s => s.id === setorId)
    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, setor_id: setorId, setor: setor || undefined } : c
    ))
    setMenuAberto(null)
    toast.success('Setor atribuído!')
  }

  // Mover via menu
  const moverParaColuna = async (conversaId: string, colunaId: string) => {
    const conversasDestino = getConversasColuna(colunaId)
    const novaOrdem = conversasDestino.length * 10

    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ 
        status_kanban: colunaId,
        ordem_kanban: novaOrdem 
      })
      .eq('id', conversaId)

    if (error) {
      toast.error('Erro ao mover')
      return
    }

    setConversas(prev => prev.map(c => 
      c.id === conversaId ? { ...c, status_kanban: colunaId, ordem_kanban: novaOrdem } : c
    ))
    setMenuAberto(null)
    toast.success(`Movido para ${COLUNAS_KANBAN.find(c => c.id === colunaId)?.nome}`)
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

  // Obter info da prioridade
  const getPrioridade = (prioridadeId: string) => {
    return PRIORIDADES.find(p => p.id === prioridadeId) || PRIORIDADES[2]
  }

  return (
    <PaginaProtegida codigoPagina="kanban">
    <div className="h-[calc(100vh-80px)] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Kanban de Atendimento</h1>
          <p className="text-muted-foreground">
            Arraste os cards para gerenciar o fluxo • {conversas.length} conversas
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
            <Button>
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
            const isDropTarget = dragOverColumn === coluna.id

            return (
              <div
                key={coluna.id}
                className={`flex-shrink-0 w-72 flex flex-col rounded-lg transition-all ${
                  isDropTarget ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                }`}
                onDragOver={(e) => handleDragOverColumn(e, coluna.id)}
                onDragLeave={() => setDragOverColumn(null)}
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
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-100 rounded-b-lg min-h-[200px]">
                  {conversasColuna.length === 0 ? (
                    <div className={`text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg ${
                      isDropTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}>
                      <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma conversa</p>
                      <p className="text-xs">Arraste para cá</p>
                    </div>
                  ) : (
                    conversasColuna.map((conversa, index) => {
                      const prioridade = getPrioridade(conversa.prioridade)
                      const isBeingDragged = draggedItem?.id === conversa.id
                      const showDropIndicator = dragOverColumn === coluna.id && dragOverIndex === index

                      return (
                        <div key={conversa.id}>
                          {/* Indicador de drop antes do card */}
                          {showDropIndicator && (
                            <div className="h-1 bg-blue-400 rounded-full mb-2 animate-pulse" />
                          )}
                          
                          <Card
                            draggable
                            onDragStart={(e) => handleDragStart(e, conversa)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOverCard(e, coluna.id, index)}
                            className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 ${prioridade.borderCor} ${
                              isBeingDragged ? 'opacity-50 scale-95' : ''
                            }`}
                          >
                            {/* Header do Card */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  {conversa.foto_perfil_url && (
                                    <AvatarImage src={conversa.foto_perfil_url} />
                                  )}
                                  <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                    {conversa.nome_contato?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">
                                    {conversa.nome_contato || conversa.telefone}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
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
                                  <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
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
                                        <div className={`w-3 h-3 rounded-full ${p.cor}`} />
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
                                      {!conversa.setor_id && <span className="ml-auto">✓</span>}
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
                                    {COLUNAS_KANBAN.filter(c => c.id !== conversa.status_kanban).map((col) => {
                                      const ColIcon = col.icon
                                      return (
                                        <button
                                          key={col.id}
                                          onClick={() => moverParaColuna(conversa.id, col.id)}
                                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <ColIcon className="h-3 w-3" />
                                          {col.nome}
                                        </button>
                                      )
                                    })}
                                    
                                    <div className="border-t my-1" />
                                    <Link href="/dashboard/crm">
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
                                <span className={`text-xs px-1.5 py-0.5 rounded text-white ${prioridade.cor}`}>
                                  {prioridade.nome}
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
                        </div>
                      )
                    })
                  )}
                  
                  {/* Indicador de drop no final da coluna */}
                  {dragOverColumn === coluna.id && dragOverIndex === conversasColuna.length && conversasColuna.length > 0 && (
                    <div className="h-1 bg-blue-400 rounded-full animate-pulse" />
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
