'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  Send, Search, Phone, User, MessageSquare, Plus, RefreshCw, 
  Check, CheckCheck, Clock, Download, Image, Paperclip, Mic, 
  X, FileText, Video, Loader2, FileType, Settings, Bot
} from 'lucide-react'
import Link from 'next/link'

type Conversa = {
  id: string
  telefone: string
  nome_contato: string | null
  ultimo_contato: string | null
  ultima_mensagem: string | null
  status: string
  associado_id: string | null
  nao_lidas: number
}

type Mensagem = {
  id: string
  conversa_id: string
  direcao: 'entrada' | 'saida'
  conteudo: string
  tipo: string
  status: string
  created_at: string
  media_url?: string
}

type Template = {
  id: string
  titulo: string
  categoria: string | null
  conteudo: string
  variaveis: string[] | null
  ativo: boolean
  uso_count: number
}

export default function CRMPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConversas, setLoadingConversas] = useState(true)
  const [showNovaConversa, setShowNovaConversa] = useState(false)
  const [showImportarContatos, setShowImportarContatos] = useState(false)
  const [contatosWhatsApp, setContatosWhatsApp] = useState<any[]>([])
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([])
  const [loadingContatos, setLoadingContatos] = useState(false)
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoNome, setNovoNome] = useState('')
  
  // Estados para mídia
  const [showAnexo, setShowAnexo] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: string, name: string } | null>(null)
  const [caption, setCaption] = useState('')
  
  // Estados para templates
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showGerenciarTemplates, setShowGerenciarTemplates] = useState(false)
  const [templateEditando, setTemplateEditando] = useState<Template | null>(null)
  const [novoTemplate, setNovoTemplate] = useState({ titulo: '', categoria: '', conteudo: '' })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Carregar conversas
  const carregarConversas = async () => {
    setLoadingConversas(true)
    let query = supabase
      .from('conversas_whatsapp')
      .select('*')
      .order('ultimo_contato', { ascending: false, nullsFirst: false })
    
    if (busca) {
      query = query.or(`nome_contato.ilike.%${busca}%,telefone.ilike.%${busca}%`)
    }
    
    const { data } = await query
    setConversas(data || [])
    setLoadingConversas(false)
  }

  useEffect(() => {
    carregarConversas()
    carregarTemplates()
  }, [busca])

  // Carregar templates
  const carregarTemplates = async () => {
    const { data } = await supabase
      .from('templates_mensagens')
      .select('*')
      .eq('ativo', true)
      .order('uso_count', { ascending: false })
    setTemplates(data || [])
  }

  // Usar template
  const usarTemplate = (template: Template) => {
    let mensagem = template.conteudo
    
    // Substituir variáveis pelo nome do contato se disponível
    if (conversaAtiva?.nome_contato) {
      mensagem = mensagem.replace(/{nome}/g, conversaAtiva.nome_contato)
    }
    
    setNovaMensagem(mensagem)
    setShowTemplates(false)
    
    // Incrementar contador de uso
    supabase
      .from('templates_mensagens')
      .update({ uso_count: (template.uso_count || 0) + 1 })
      .eq('id', template.id)
      .then()
  }

  // Salvar template
  const salvarTemplate = async () => {
    if (!novoTemplate.titulo.trim() || !novoTemplate.conteudo.trim()) {
      toast.error('Título e conteúdo são obrigatórios')
      return
    }

    // Extrair variáveis do conteúdo (palavras entre {})
    const variaveis = novoTemplate.conteudo.match(/{(\w+)}/g)?.map(v => v.replace(/[{}]/g, '')) || []

    if (templateEditando) {
      const { error } = await supabase
        .from('templates_mensagens')
        .update({
          titulo: novoTemplate.titulo,
          categoria: novoTemplate.categoria || null,
          conteudo: novoTemplate.conteudo,
          variaveis,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateEditando.id)

      if (error) {
        toast.error('Erro ao atualizar: ' + error.message)
        return
      }
      toast.success('Template atualizado!')
    } else {
      const { error } = await supabase
        .from('templates_mensagens')
        .insert({
          titulo: novoTemplate.titulo,
          categoria: novoTemplate.categoria || null,
          conteudo: novoTemplate.conteudo,
          variaveis
        })

      if (error) {
        toast.error('Erro ao criar: ' + error.message)
        return
      }
      toast.success('Template criado!')
    }

    setNovoTemplate({ titulo: '', categoria: '', conteudo: '' })
    setTemplateEditando(null)
    carregarTemplates()
  }

  // Excluir template
  const excluirTemplate = async (id: string) => {
    if (!confirm('Excluir este template?')) return
    
    const { error } = await supabase
      .from('templates_mensagens')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    toast.success('Template excluído!')
    carregarTemplates()
  }

  // Carregar mensagens da conversa ativa
  useEffect(() => {
    if (!conversaAtiva) return

    const fetchMensagens = async () => {
      const { data } = await supabase
        .from('mensagens_whatsapp')
        .select('*')
        .eq('conversa_id', conversaAtiva.id)
        .order('created_at', { ascending: true })
      
      setMensagens(data || [])

      await supabase
        .from('conversas_whatsapp')
        .update({ nao_lidas: 0 })
        .eq('id', conversaAtiva.id)
    }
    
    fetchMensagens()

    const channel = supabase
      .channel(`mensagens-${conversaAtiva.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens_whatsapp',
        filter: `conversa_id=eq.${conversaAtiva.id}`
      }, (payload) => {
        setMensagens((prev) => [...prev, payload.new as Mensagem])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversaAtiva, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Criar nova conversa
  const criarConversa = async () => {
    if (!novoTelefone.trim()) {
      toast.error('Informe o número de telefone')
      return
    }

    const telefoneFormatado = novoTelefone.replace(/\D/g, '')
    
    const { data: existente } = await supabase
      .from('conversas_whatsapp')
      .select('id')
      .eq('telefone', telefoneFormatado)
      .single()

    if (existente) {
      toast.error('Já existe uma conversa com este número')
      return
    }

    const { data, error } = await supabase
      .from('conversas_whatsapp')
      .insert({
        telefone: telefoneFormatado,
        nome_contato: novoNome || null,
        status: 'aberta',
        nao_lidas: 0
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar conversa: ' + error.message)
      return
    }

    setShowNovaConversa(false)
    setNovoTelefone('')
    setNovoNome('')
    setConversaAtiva(data)
    carregarConversas()
    toast.success('Conversa criada!')
  }

  // Buscar contatos do WhatsApp
  const buscarContatosWhatsApp = async () => {
    setLoadingContatos(true)
    try {
      const response = await fetch('/api/wasender/contacts')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar contatos')
      }

      const contatos = result.contacts || []
      setContatosWhatsApp(contatos)
      setContatosSelecionados([])
      
      if (contatos.length === 0) {
        toast.info('Nenhum contato encontrado')
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoadingContatos(false)
    }
  }

  // Importar contatos selecionados
  const importarContatos = async () => {
    if (contatosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um contato')
      return
    }

    setLoadingContatos(true)
    try {
      const contatosParaImportar = contatosWhatsApp.filter(c => 
        contatosSelecionados.includes(c.id || c.number || c.phone)
      )

      const response = await fetch('/api/wasender/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: contatosParaImportar })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar')
      }

      toast.success(`${result.importados} contatos importados! (${result.existentes} já existiam)`)
      setShowImportarContatos(false)
      setContatosWhatsApp([])
      setContatosSelecionados([])
      carregarConversas()
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoadingContatos(false)
    }
  }

  const toggleContato = (id: string) => {
    setContatosSelecionados(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selecionarTodos = () => {
    if (contatosSelecionados.length === contatosWhatsApp.length) {
      setContatosSelecionados([])
    } else {
      setContatosSelecionados(contatosWhatsApp.map(c => c.id || c.number || c.phone))
    }
  }

  // Enviar mensagem de texto
  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversaAtiva) return
    
    setLoading(true)
    try {
      let numero = conversaAtiva.telefone.replace(/\D/g, '')
      if (!numero.startsWith('55') && numero.length <= 11) {
        numero = '55' + numero
      }

      const response = await fetch('/api/wasender/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: numero,
          text: novaMensagem
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem')
      }

      await supabase.from('mensagens_whatsapp').insert({
        conversa_id: conversaAtiva.id,
        direcao: 'saida',
        conteudo: novaMensagem,
        tipo: 'texto',
        status: 'enviada'
      })

      await supabase.from('conversas_whatsapp').update({
        ultimo_contato: new Date().toISOString(),
        ultima_mensagem: novaMensagem
      }).eq('id', conversaAtiva.id)

      setNovaMensagem('')
      carregarConversas()
      toast.success('Mensagem enviada!')

    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Selecionar arquivo
  const selecionarArquivo = (tipo: 'image' | 'document' | 'audio' | 'video') => {
    if (fileInputRef.current) {
      const accepts: Record<string, string> = {
        image: 'image/*',
        document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
        audio: 'audio/*',
        video: 'video/*'
      }
      fileInputRef.current.accept = accepts[tipo]
      fileInputRef.current.click()
    }
    setShowAnexo(false)
  }

  // Handle arquivo selecionado
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.')
      return
    }

    // Preview
    const fileType = file.type.split('/')[0]
    const previewUrl = URL.createObjectURL(file)
    setMediaPreview({ url: previewUrl, type: fileType, name: file.name })
    setCaption('')

    // Resetar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cancelar envio de mídia
  const cancelarMedia = () => {
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url)
    }
    setMediaPreview(null)
    setCaption('')
  }

  // Enviar mídia
  const enviarMedia = async () => {
    if (!mediaPreview || !conversaAtiva) return

    setUploadingMedia(true)
    try {
      // Primeiro fazer upload do arquivo
      const fileInput = document.createElement('input')
      const response = await fetch(mediaPreview.url)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('file', blob, mediaPreview.name)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Erro no upload')
      }

      // Determinar tipo de mensagem
      let messageType = 'document'
      if (mediaPreview.type === 'image') messageType = 'image'
      else if (mediaPreview.type === 'video') messageType = 'video'
      else if (mediaPreview.type === 'audio') messageType = 'audio'

      // Enviar via WaSender
      let numero = conversaAtiva.telefone.replace(/\D/g, '')
      if (!numero.startsWith('55') && numero.length <= 11) {
        numero = '55' + numero
      }

      const sendResponse = await fetch('/api/wasender/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: numero,
          messageType,
          mediaUrl: uploadResult.url,
          caption: caption || undefined,
          fileName: mediaPreview.name
        })
      })

      const sendResult = await sendResponse.json()

      if (!sendResponse.ok) {
        throw new Error(sendResult.error || 'Erro ao enviar')
      }

      // Salvar no banco
      const conteudo = caption || `📎 ${mediaPreview.name}`
      await supabase.from('mensagens_whatsapp').insert({
        conversa_id: conversaAtiva.id,
        direcao: 'saida',
        conteudo,
        tipo: messageType,
        status: 'enviada',
        media_url: uploadResult.url
      })

      await supabase.from('conversas_whatsapp').update({
        ultimo_contato: new Date().toISOString(),
        ultima_mensagem: conteudo
      }).eq('id', conversaAtiva.id)

      cancelarMedia()
      carregarConversas()
      toast.success('Mídia enviada!')

    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setUploadingMedia(false)
    }
  }

  const formatarData = (data: string | null) => {
    if (!data) return ''
    const d = new Date(data)
    const hoje = new Date()
    if (d.toDateString() === hoje.toDateString()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lida': return <CheckCheck className="h-3 w-3 text-blue-400" />
      case 'entregue': return <CheckCheck className="h-3 w-3" />
      case 'enviada': return <Check className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  // Renderizar conteúdo da mensagem
  const renderMensagem = (msg: Mensagem) => {
    if (msg.tipo === 'image' && msg.media_url) {
      return (
        <div>
          <img src={msg.media_url} alt="Imagem" className="max-w-full rounded-lg mb-1" />
          {msg.conteudo && !msg.conteudo.startsWith('📎') && (
            <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
          )}
        </div>
      )
    }
    if (msg.tipo === 'video' && msg.media_url) {
      return (
        <div>
          <video src={msg.media_url} controls className="max-w-full rounded-lg mb-1" />
          {msg.conteudo && !msg.conteudo.startsWith('📎') && (
            <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
          )}
        </div>
      )
    }
    if (msg.tipo === 'audio' && msg.media_url) {
      return <audio src={msg.media_url} controls className="max-w-full" />
    }
    if (msg.tipo === 'document' && msg.media_url) {
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 underline">
          <FileText className="h-4 w-4" />
          {msg.conteudo || 'Documento'}
        </a>
      )
    }
    return <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Input de arquivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Lista de Conversas */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Conversas</h2>
            <div className="flex gap-1">
              <Link href="/dashboard/respostas-automaticas">
                <Button 
                  variant="ghost" 
                  size="icon"
                  title="Respostas automáticas"
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setShowImportarContatos(true)
                  buscarContatosWhatsApp()
                }}
                title="Importar contatos do WhatsApp"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowNovaConversa(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversas ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma conversa</p>
            </div>
          ) : (
            conversas.map((conversa) => (
              <div
                key={conversa.id}
                onClick={() => setConversaAtiva(conversa)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  conversaAtiva?.id === conversa.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {conversa.nome_contato?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {conversa.nome_contato || conversa.telefone}
                      </p>
                      {conversa.ultimo_contato && (
                        <span className="text-xs text-muted-foreground">
                          {formatarData(conversa.ultimo_contato)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversa.ultima_mensagem || 'Sem mensagens'}
                      </p>
                      {conversa.nao_lidas > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversa.nao_lidas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Área de Chat */}
      <Card className="flex-1 flex flex-col">
        {conversaAtiva ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {conversaAtiva.nome_contato?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{conversaAtiva.nome_contato || conversaAtiva.telefone}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {conversaAtiva.telefone}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensagens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
                </div>
              ) : (
                mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.direcao === 'saida'
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white shadow rounded-bl-none'
                      }`}
                    >
                      {renderMensagem(msg)}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.direcao === 'saida' ? 'text-green-100' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">{formatarHora(msg.created_at)}</span>
                        {msg.direcao === 'saida' && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview de mídia */}
            {mediaPreview && (
              <div className="p-4 border-t bg-gray-100">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {mediaPreview.type === 'image' ? (
                      <img src={mediaPreview.url} alt="Preview" className="h-20 w-20 object-cover rounded" />
                    ) : mediaPreview.type === 'video' ? (
                      <video src={mediaPreview.url} className="h-20 w-20 object-cover rounded" />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                    <button
                      onClick={cancelarMedia}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{mediaPreview.name}</p>
                    <Input
                      placeholder="Adicionar legenda..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={enviarMedia} disabled={uploadingMedia}>
                    {uploadingMedia ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Input de Mensagem */}
            {!mediaPreview && (
              <div className="p-4 border-t">
                <div className="flex gap-2 items-center">
                  {/* Botão de anexo */}
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => { setShowAnexo(!showAnexo); setShowTemplates(false) }}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    {/* Menu de anexos */}
                    {showAnexo && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 flex flex-col gap-1 min-w-[140px]">
                        <button
                          onClick={() => selecionarArquivo('image')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm"
                        >
                          <Image className="h-4 w-4 text-blue-500" />
                          Imagem
                        </button>
                        <button
                          onClick={() => selecionarArquivo('video')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm"
                        >
                          <Video className="h-4 w-4 text-purple-500" />
                          Vídeo
                        </button>
                        <button
                          onClick={() => selecionarArquivo('document')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm"
                        >
                          <FileText className="h-4 w-4 text-orange-500" />
                          Documento
                        </button>
                        <button
                          onClick={() => selecionarArquivo('audio')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm"
                        >
                          <Mic className="h-4 w-4 text-green-500" />
                          Áudio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botão de Templates */}
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => { setShowTemplates(!showTemplates); setShowAnexo(false) }}
                      title="Templates de mensagens"
                    >
                      <FileType className="h-5 w-5" />
                    </Button>
                    
                    {/* Menu de templates */}
                    {showTemplates && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 min-w-[280px] max-h-[300px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="text-sm font-medium">Templates</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setShowTemplates(false); setShowGerenciarTemplates(true) }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Gerenciar
                          </Button>
                        </div>
                        {templates.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Nenhum template</p>
                        ) : (
                          templates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => usarTemplate(t)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                            >
                              <p className="font-medium">{t.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate">{t.conteudo.substring(0, 50)}...</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={enviarMensagem} disabled={loading || !novaMensagem.trim()}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Selecione uma conversa</p>
              <p className="text-sm">ou clique em + para iniciar uma nova</p>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Nova Conversa */}
      {showNovaConversa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Nova Conversa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  placeholder="Ex: 16999998888"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Apenas números, com DDD</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nome do Contato</label>
                <Input
                  placeholder="Nome (opcional)"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNovaConversa(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={criarConversa} className="flex-1">Criar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Importar Contatos */}
      {showImportarContatos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Importar Contatos do WhatsApp</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowImportarContatos(false)}>✕</Button>
            </div>
            
            {loadingContatos ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Buscando contatos...</span>
              </div>
            ) : contatosWhatsApp.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mb-2 opacity-50" />
                <p>Nenhum contato encontrado</p>
                <Button variant="outline" className="mt-4" onClick={buscarContatosWhatsApp}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contatosSelecionados.length === contatosWhatsApp.length}
                      onChange={selecionarTodos}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Selecionar todos ({contatosWhatsApp.length})</span>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {contatosSelecionados.length} selecionados
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 mb-4">
                  {contatosWhatsApp.map((contato) => {
                    const id = contato.id || contato.number || contato.phone
                    const nome = contato.name || contato.pushName || contato.notify || 'Sem nome'
                    const telefone = (contato.number || contato.phone || contato.id || '').replace('@c.us', '')
                    
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={contatosSelecionados.includes(id)}
                          onChange={() => toggleContato(id)}
                          className="h-4 w-4"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{nome}</p>
                          <p className="text-sm text-muted-foreground">{telefone}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowImportarContatos(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={importarContatos} 
                    disabled={contatosSelecionados.length === 0 || loadingContatos}
                    className="flex-1"
                  >
                    Importar ({contatosSelecionados.length})
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Modal Gerenciar Templates */}
      {showGerenciarTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Gerenciar Templates</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowGerenciarTemplates(false); setTemplateEditando(null); setNovoTemplate({ titulo: '', categoria: '', conteudo: '' }) }}>✕</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Formulário */}
              <div className="space-y-3">
                <h3 className="font-medium">{templateEditando ? 'Editar Template' : 'Novo Template'}</h3>
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    placeholder="Ex: Boas-vindas"
                    value={novoTemplate.titulo}
                    onChange={(e) => setNovoTemplate({ ...novoTemplate, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    placeholder="Ex: Financeiro, Geral, Eventos..."
                    value={novoTemplate.categoria}
                    onChange={(e) => setNovoTemplate({ ...novoTemplate, categoria: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conteúdo *</label>
                  <textarea
                    placeholder="Digite a mensagem... Use {nome}, {valor}, {data} para variáveis"
                    value={novoTemplate.conteudo}
                    onChange={(e) => setNovoTemplate({ ...novoTemplate, conteudo: e.target.value })}
                    className="w-full h-32 px-3 py-2 border rounded-md text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis: {'{nome}'}, {'{valor}'}, {'{data}'}, {'{evento}'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {templateEditando && (
                    <Button variant="outline" onClick={() => { setTemplateEditando(null); setNovoTemplate({ titulo: '', categoria: '', conteudo: '' }) }}>
                      Cancelar
                    </Button>
                  )}
                  <Button onClick={salvarTemplate} className="flex-1">
                    {templateEditando ? 'Atualizar' : 'Criar Template'}
                  </Button>
                </div>
              </div>

              {/* Lista de templates */}
              <div className="border-l pl-4 overflow-y-auto">
                <h3 className="font-medium mb-3">Templates Existentes ({templates.length})</h3>
                <div className="space-y-2">
                  {templates.map((t) => (
                    <div key={t.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{t.titulo}</p>
                          {t.categoria && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t.categoria}</span>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.conteudo}</p>
                          <p className="text-xs text-muted-foreground mt-1">Usado {t.uso_count}x</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTemplateEditando(t)
                              setNovoTemplate({ titulo: t.titulo, categoria: t.categoria || '', conteudo: t.conteudo })
                            }}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluirTemplate(t.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
