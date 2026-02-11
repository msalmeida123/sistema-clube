'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Plus, Trash2, Wifi, WifiOff, RefreshCw, Star, StarOff,
  Smartphone, Globe, Check, Loader2, Copy, ExternalLink,
  MessageSquare, FileText, ShoppingBag, CreditCard, Settings
} from 'lucide-react'

type Provider = {
  id: string
  nome: string
  tipo: 'wasender' | 'meta'
  ativo: boolean
  is_default: boolean
  wasender_api_key?: string
  wasender_device_id?: string
  wasender_personal_token?: string
  meta_app_id?: string
  meta_app_secret?: string
  meta_access_token?: string
  meta_phone_number_id?: string
  meta_waba_id?: string
  meta_verify_token?: string
  meta_catalog_id?: string
  telefone?: string
  nome_exibicao?: string
  status?: string
  ultimo_check?: string
}

type FormData = Partial<Provider> & { tipo: 'wasender' | 'meta' }

const emptyForm: FormData = {
  nome: '',
  tipo: 'meta',
  ativo: true,
  is_default: false,
}

export default function WhatsAppProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const metaWebhookUrl = `${baseUrl}/api/whatsapp-meta/webhook`

  const carregarProviders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/providers')
      const data = await res.json()
      if (data.providers) setProviders(data.providers)
    } catch {
      toast.error('Erro ao carregar providers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarProviders() }, [carregarProviders])

  const salvar = async () => {
    if (!form.nome?.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form

      const res = await fetch('/api/whatsapp/providers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(editingId ? 'Provider atualizado' : 'Provider criado')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      carregarProviders()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const excluir = async (id: string) => {
    if (!confirm('Tem certeza? Conversas associadas perderão o vínculo.')) return
    try {
      const res = await fetch(`/api/whatsapp/providers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Provider excluído')
      carregarProviders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const testar = async (provider: Provider) => {
    setTestingId(provider.id)
    try {
      const res = await fetch('/api/whatsapp/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', id: provider.id, tipo: provider.tipo })
      })
      const data = await res.json()
      if (data.status?.connected) {
        toast.success(`Conectado! ${data.status.phone || ''} ${data.status.name || ''}`)
      } else {
        toast.error(`Desconectado: ${data.status?.status || 'sem resposta'}`)
      }
      carregarProviders()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setTestingId(null)
    }
  }

  const setDefault = async (id: string) => {
    try {
      const res = await fetch('/api/whatsapp/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true })
      })
      if (!res.ok) throw new Error('Erro')
      toast.success('Provider definido como padrão')
      carregarProviders()
    } catch {
      toast.error('Erro ao definir padrão')
    }
  }

  const editar = (provider: Provider) => {
    setForm(provider)
    setEditingId(provider.id)
    setShowForm(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Providers</h1>
          <p className="text-muted-foreground">Gerencie conexões WaSender e Meta Cloud API</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Provider
        </Button>
      </div>

      {/* Providers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Nenhum provider configurado</p>
            <p className="text-muted-foreground mb-4">Adicione uma conexão WaSender ou Meta Cloud API</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Configurar Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map(provider => (
            <Card key={provider.id} className={`relative ${!provider.ativo ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      provider.tipo === 'meta' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {provider.tipo === 'meta' ? <Globe className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {provider.nome}
                        {provider.is_default && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Padrão</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          provider.tipo === 'meta' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {provider.tipo === 'meta' ? 'Meta Cloud API' : 'WaSender'}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {provider.telefone && `📱 ${provider.telefone}`}
                        {provider.nome_exibicao && ` · ${provider.nome_exibicao}`}
                        {provider.status && ` · ${provider.status}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status icon */}
                    {provider.status === 'conectado' || provider.status?.includes('connected') ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Recursos do Meta */}
                {provider.tipo === 'meta' && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <MessageSquare className="w-3 h-3" /> Mensagens
                    </span>
                    <span className="text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <FileText className="w-3 h-3" /> Templates
                    </span>
                    {provider.meta_catalog_id && (
                      <span className="text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <ShoppingBag className="w-3 h-3" /> Catálogo
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <CreditCard className="w-3 h-3" /> Pagamentos
                    </span>
                  </div>
                )}

                {/* Webhook URL para Meta */}
                {provider.tipo === 'meta' && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Webhook URL (configurar no Meta Developers):</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white border px-2 py-1 rounded flex-1 truncate">
                        {metaWebhookUrl}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(metaWebhookUrl)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {provider.meta_verify_token && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Verify Token:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white border px-2 py-1 rounded">
                            {provider.meta_verify_token}
                          </code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(provider.meta_verify_token!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => testar(provider)} disabled={testingId === provider.id}>
                    {testingId === provider.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Testar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => editar(provider)}>
                    <Settings className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  {!provider.is_default && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(provider.id)}>
                      <Star className="w-3 h-3 mr-1" /> Definir Padrão
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => excluir(provider.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Provider' : 'Novo Provider'}
            </h2>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: WhatsApp Oficial do Clube"
                  value={form.nome || ''}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`border rounded-lg p-3 text-left ${form.tipo === 'meta' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => setForm(f => ({ ...f, tipo: 'meta' }))}
                  >
                    <Globe className="w-5 h-5 mb-1 text-blue-600" />
                    <div className="font-medium text-sm">Meta Cloud API</div>
                    <div className="text-xs text-gray-500">API Oficial - Templates, catálogo, pagamentos</div>
                  </button>
                  <button
                    type="button"
                    className={`border rounded-lg p-3 text-left ${form.tipo === 'wasender' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                    onClick={() => setForm(f => ({ ...f, tipo: 'wasender' }))}
                  >
                    <Smartphone className="w-5 h-5 mb-1 text-green-600" />
                    <div className="font-medium text-sm">WaSender</div>
                    <div className="text-xs text-gray-500">Conexão por QR Code - rápido e simples</div>
                  </button>
                </div>
              </div>

              {/* Meta Fields */}
              {form.tipo === 'meta' && (
                <div className="space-y-4 border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">📋 Como configurar:</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noopener" className="underline">business.facebook.com</a> e crie uma conta Business</li>
                      <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="underline">developers.facebook.com</a> e crie um App tipo "Business"</li>
                      <li>Adicione o produto "WhatsApp" ao app</li>
                      <li>Em Configuration &gt; Webhook, use a URL e Token abaixo</li>
                      <li>Copie o Phone Number ID, WABA ID e Access Token</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Phone Number ID *</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Ex: 123456789012345"
                        value={form.meta_phone_number_id || ''}
                        onChange={e => setForm(f => ({ ...f, meta_phone_number_id: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">WABA ID *</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="WhatsApp Business Account ID"
                        value={form.meta_waba_id || ''}
                        onChange={e => setForm(f => ({ ...f, meta_waba_id: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Access Token (Permanente) *</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="System User Token"
                      value={form.meta_access_token || ''}
                      onChange={e => setForm(f => ({ ...f, meta_access_token: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Use um System User Token permanente, não o token temporário de teste</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">App ID</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.meta_app_id || ''}
                        onChange={e => setForm(f => ({ ...f, meta_app_id: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">App Secret</label>
                      <input
                        type="password"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.meta_app_secret || ''}
                        onChange={e => setForm(f => ({ ...f, meta_app_secret: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Verify Token (para webhook)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Token personalizado para verificação"
                        value={form.meta_verify_token || ''}
                        onChange={e => setForm(f => ({ ...f, meta_verify_token: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const token = `clube_${Math.random().toString(36).substring(2, 15)}`
                          setForm(f => ({ ...f, meta_verify_token: token }))
                        }}
                      >
                        Gerar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Catalog ID (opcional)</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="ID do catálogo de produtos"
                      value={form.meta_catalog_id || ''}
                      onChange={e => setForm(f => ({ ...f, meta_catalog_id: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* WaSender Fields */}
              {form.tipo === 'wasender' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">API Key *</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.wasender_api_key || ''}
                      onChange={e => setForm(f => ({ ...f, wasender_api_key: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Device ID *</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.wasender_device_id || ''}
                      onChange={e => setForm(f => ({ ...f, wasender_device_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.wasender_personal_token || ''}
                      onChange={e => setForm(f => ({ ...f, wasender_personal_token: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Default */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default || false}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                />
                <label htmlFor="is_default" className="text-sm">Definir como provider padrão</label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {editingId ? 'Salvar' : 'Criar Provider'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📖 Guia de Setup da Meta Cloud API</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="space-y-2">
            <p className="font-medium">1. Conta Meta Business</p>
            <p className="text-gray-600">
              Acesse{' '}
              <a href="https://business.facebook.com" target="_blank" rel="noopener" className="text-blue-600 underline">
                business.facebook.com
              </a>{' '}
              e crie/verifique sua conta de negócios.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">2. Criar App no Meta Developers</p>
            <p className="text-gray-600">
              Vá em{' '}
              <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener" className="text-blue-600 underline">
                developers.facebook.com
              </a>
              , crie um app tipo "Business" e adicione o produto "WhatsApp".
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">3. Token Permanente</p>
            <p className="text-gray-600">
              Em Business Settings &gt; System Users, crie um System User e gere um token com permissões
              <code className="bg-gray-100 px-1 rounded">whatsapp_business_messaging</code> e
              <code className="bg-gray-100 px-1 rounded">whatsapp_business_management</code>.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">4. Configurar Webhook</p>
            <p className="text-gray-600">No app, vá em WhatsApp &gt; Configuration &gt; Webhook e configure:</p>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs font-medium">Callback URL:</p>
              <code className="text-xs">{metaWebhookUrl}</code>
              <p className="text-xs font-medium mt-2">Inscreva-se em: <code>messages</code></p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">5. Registrar Número</p>
            <p className="text-gray-600">
              Adicione e verifique seu número de telefone real em WhatsApp &gt; Getting Started. 
              Durante desenvolvimento, use o número de teste gratuito da Meta.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
