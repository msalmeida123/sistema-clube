// =====================================================
// API de Gerenciamento de Providers WhatsApp
// CRUD + status + testar conexão
// =====================================================

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createProvider } from '@/lib/whatsapp/factory'
import { ProviderConfig } from '@/lib/whatsapp/provider'

// GET - Listar providers
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: providers, error } = await supabase
      .from('whatsapp_providers')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mascarar tokens sensíveis
    const safe = (providers || []).map(p => ({
      ...p,
      wasender_api_key: p.wasender_api_key ? '****' + p.wasender_api_key.slice(-4) : null,
      wasender_personal_token: p.wasender_personal_token ? '****' + p.wasender_personal_token.slice(-4) : null,
      meta_access_token: p.meta_access_token ? '****' + p.meta_access_token.slice(-4) : null,
      meta_app_secret: p.meta_app_secret ? '****' + p.meta_app_secret.slice(-4) : null,
    }))

    return NextResponse.json({ success: true, providers: safe })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar provider
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { action, ...providerData } = body

    // Ação especial: testar conexão
    if (action === 'test') {
      return await testarConexao(body)
    }

    // Ação especial: buscar status
    if (action === 'status') {
      return await buscarStatus(body.id)
    }

    // Ação especial: buscar templates Meta
    if (action === 'templates') {
      return await buscarTemplates(body.id)
    }

    // Validar tipo
    if (!['wasender', 'meta'].includes(providerData.tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser "wasender" ou "meta"' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('whatsapp_providers')
      .insert({
        nome: providerData.nome || `Provider ${providerData.tipo}`,
        tipo: providerData.tipo,
        ativo: providerData.ativo ?? true,
        is_default: providerData.is_default ?? false,
        // WaSender
        wasender_api_key: providerData.wasender_api_key || null,
        wasender_device_id: providerData.wasender_device_id || null,
        wasender_personal_token: providerData.wasender_personal_token || null,
        // Meta
        meta_app_id: providerData.meta_app_id || null,
        meta_app_secret: providerData.meta_app_secret || null,
        meta_access_token: providerData.meta_access_token || null,
        meta_phone_number_id: providerData.meta_phone_number_id || null,
        meta_waba_id: providerData.meta_waba_id || null,
        meta_verify_token: providerData.meta_verify_token || null,
        meta_catalog_id: providerData.meta_catalog_id || null,
        // Meta
        telefone: providerData.telefone || null,
        nome_exibicao: providerData.nome_exibicao || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, provider: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar provider
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

    // Não atualizar campos com '****' (mascarados)
    const fieldsToCheck = ['wasender_api_key', 'wasender_personal_token', 'meta_access_token', 'meta_app_secret']
    for (const field of fieldsToCheck) {
      if (updateData[field] && updateData[field].startsWith('****')) {
        delete updateData[field]
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, provider: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover provider
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

    const { error } = await supabase
      .from('whatsapp_providers')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ==========================================
// Helpers
// ==========================================

async function testarConexao(body: any) {
  try {
    const config: ProviderConfig = {
      id: body.id || 'test',
      nome: body.nome || 'Test',
      tipo: body.tipo,
      ativo: true,
      is_default: false,
      ...body
    }

    const provider = createProvider(config)
    const status = await provider.getSessionStatus()

    // Atualizar status no banco se tem id
    if (body.id && body.id !== 'test') {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase
        .from('whatsapp_providers')
        .update({ 
          status: status.connected ? 'conectado' : 'desconectado',
          telefone: status.phone || null,
          nome_exibicao: status.name || null,
          ultimo_check: new Date().toISOString()
        })
        .eq('id', body.id)
    }

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function buscarStatus(id: string) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: config } = await supabase
      .from('whatsapp_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (!config) return NextResponse.json({ error: 'Provider não encontrado' }, { status: 404 })

    const provider = createProvider(config as ProviderConfig)
    const status = await provider.getSessionStatus()

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function buscarTemplates(id: string) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: config } = await supabase
      .from('whatsapp_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (!config || config.tipo !== 'meta') {
      return NextResponse.json({ error: 'Provider Meta não encontrado' }, { status: 404 })
    }

    const provider = createProvider(config as ProviderConfig)
    if (!provider.listTemplates) {
      return NextResponse.json({ error: 'Provider não suporta templates' }, { status: 400 })
    }

    const templates = await provider.listTemplates()
    return NextResponse.json({ success: true, templates })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
