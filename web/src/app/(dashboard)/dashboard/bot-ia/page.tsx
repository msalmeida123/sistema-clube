'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Bot, Save, Eye, EyeOff, Sparkles, FileText, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BotIAPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testando, setTestando] = useState(false)
  const [mensagemTeste, setMensagemTeste] = useState('')
  const [respostaTeste, setRespostaTeste] = useState('')
  
  const [config, setConfig] = useState({
    openai_api_key: '',
    modelo: 'gpt-4o-mini',
    documento_contexto: '',
    instrucoes_sistema: '',
    temperatura: 0.7,
    max_tokens: 500,
    transcrever_audios: true,
    responder_com_ia: true
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    const { data } = await supabase
      .from('config_bot_ia')
      .select('*')
      .single()

    if (data) {
      setConfig({
        openai_api_key: data.openai_api_key || '',
        modelo: data.modelo || 'gpt-4o-mini',
        documento_contexto: data.documento_contexto || '',
        instrucoes_sistema: data.instrucoes_sistema || '',
        temperatura: data.temperatura || 0.7,
        max_tokens: data.max_tokens || 500,
        transcrever_audios: data.transcrever_audios ?? true,
        responder_com_ia: data.responder_com_ia ?? true
      })
    }
    setLoading(false)
  }

  const salvar = async () => {
    setSaving(true)
    
    // Verificar se já existe registro
    const { data: existente } = await supabase
      .from('config_bot_ia')
      .select('id')
      .single()

    let error
    if (existente) {
      const result = await supabase
        .from('config_bot_ia')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', existente.id)
      error = result.error
    } else {
      const result = await supabase
        .from('config_bot_ia')
        .insert(config)
      error = result.error
    }

    setSaving(false)
    
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Configurações salvas!')
    }
  }

  const testarIA = async () => {
    if (!mensagemTeste.trim()) {
      toast.error('Digite uma mensagem para testar')
      return
    }
    if (!config.openai_api_key) {
      toast.error('Configure a API Key primeiro')
      return
    }

    setTestando(true)
    setRespostaTeste('')

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: mensagemTeste, tipo: 'texto' })
      })

      const data = await response.json()
      
      if (data.resposta) {
        setRespostaTeste(data.resposta)
      } else {
        setRespostaTeste('Erro: Não foi possível gerar resposta')
      }
    } catch (error: any) {
      setRespostaTeste('Erro: ' + error.message)
    }

    setTestando(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/respostas-automaticas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Bot com Inteligência Artificial
          </h1>
          <p className="text-muted-foreground">Configure o ChatGPT para responder automaticamente</p>
        </div>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">OpenAI API Key *</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={config.openai_api_key}
                onChange={e => setConfig({ ...config, openai_api_key: e.target.value })}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-500 underline">platform.openai.com/api-keys</a>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Modelo</label>
              <select
                value={config.modelo}
                onChange={e => setConfig({ ...config, modelo: e.target.value })}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Barato)</option>
                <option value="gpt-4o">GPT-4o (Melhor)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Temperatura ({config.temperatura})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperatura}
                onChange={e => setConfig({ ...config, temperatura: parseFloat(e.target.value) })}
                className="w-full mt-2"
              />
              <p className="text-xs text-muted-foreground">0=Preciso, 1=Criativo</p>
            </div>
            <div>
              <label className="text-sm font-medium">Max Tokens</label>
              <Input
                type="number"
                value={config.max_tokens}
                onChange={e => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 500 })}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.responder_com_ia}
                onChange={e => setConfig({ ...config, responder_com_ia: e.target.checked })}
                className="h-4 w-4"
              />
              <span>Ativar respostas com IA</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.transcrever_audios}
                onChange={e => setConfig({ ...config, transcrever_audios: e.target.checked })}
                className="h-4 w-4"
              />
              <span>Transcrever áudios (Whisper)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Instruções do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Instruções do Bot
          </CardTitle>
          <CardDescription>Como o bot deve se comportar</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={config.instrucoes_sistema}
            onChange={e => setConfig({ ...config, instrucoes_sistema: e.target.value })}
            placeholder="Ex: Você é um assistente virtual do clube. Seja educado e objetivo..."
            className="w-full h-32 px-3 py-2 border rounded-md text-sm resize-none"
          />
        </CardContent>
      </Card>

      {/* Documento do Clube */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documento do Clube
          </CardTitle>
          <CardDescription>Informações que o bot usará para responder (horários, preços, regras, etc)</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={config.documento_contexto}
            onChange={e => setConfig({ ...config, documento_contexto: e.target.value })}
            placeholder="# Informações do Clube&#10;&#10;## Horários&#10;- Segunda a Sexta: 6h às 22h&#10;&#10;## Mensalidades&#10;- Individual: R$ 150,00"
            className="w-full h-64 px-3 py-2 border rounded-md text-sm font-mono resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use formato Markdown. Quanto mais detalhado, melhores as respostas.
          </p>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvar} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Área de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Testar Bot</CardTitle>
          <CardDescription>Envie uma mensagem de teste para ver como o bot responde</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma pergunta... Ex: Qual o horário de funcionamento?"
              value={mensagemTeste}
              onChange={e => setMensagemTeste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testarIA()}
            />
            <Button onClick={testarIA} disabled={testando}>
              {testando ? 'Pensando...' : 'Testar'}
            </Button>
          </div>
          
          {respostaTeste && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">Resposta do Bot:</p>
              <p className="text-sm whitespace-pre-wrap">{respostaTeste}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
