import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Sanitizar telefone (apenas números)
function sanitizarTelefone(telefone: string | undefined | null): string {
  if (!telefone) return ''
  return telefone.replace(/\D/g, '').substring(0, 15)
}

// Verificar autenticação usando a API key do WaSender
async function verificarAutenticacao(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')
  
  // Aceitar tanto Bearer token quanto x-api-key header
  const tokenRecebido = authHeader?.replace('Bearer ', '') || apiKeyHeader
  
  if (!tokenRecebido) {
    return false
  }
  
  // Buscar a API key configurada no banco
  const { data: config } = await getSupabase()
    .from('config_wasender')
    .select('api_key')
    .single()
  
  // Verificar se o token corresponde à API key do WaSender
  return config?.api_key === tokenRecebido
}

// Buscar informações do contato via API do WaSender
async function buscarInfoContato(telefone: string, apiKey: string): Promise<{ nome?: string; foto?: string } | null> {
  try {
    let numero = sanitizarTelefone(telefone)
    if (!numero.startsWith('55')) numero = '55' + numero

    // Buscar informações do contato (inclui nome)
    const infoResponse = await fetch(`https://www.wasenderapi.com/api/contacts/${numero}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(10000)
    })

    let nome: string | undefined
    if (infoResponse.ok) {
      const infoResult = await infoResponse.json()
      if (infoResult.success && infoResult.data) {
        nome = infoResult.data.pushName || infoResult.data.name || infoResult.data.notify || infoResult.data.verifiedName
      }
    }

    // Buscar foto de perfil
    const fotoResponse = await fetch(`https://www.wasenderapi.com/api/contacts/${numero}/picture`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(10000)
    })

    let foto: string | undefined
    if (fotoResponse.ok) {
      const fotoResult = await fotoResponse.json()
      if (fotoResult.success && fotoResult.data?.imgUrl) {
        foto = fotoResult.data.imgUrl
      }
    }

    return { nome, foto }
  } catch (error) {
    console.error(`Erro ao buscar info do contato ${telefone}:`, error)
    return null
  }
}

// POST - Sincronizar todas as conversas
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const autenticado = await verificarAutenticacao(request)
    if (!autenticado) {
      return NextResponse.json(
        { error: 'Não autorizado. Envie a API key no header Authorization ou x-api-key.' },
        { status: 401 }
      )
    }

    // Pegar configuração da API
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    // Buscar todas as conversas que precisam de atualização
    const { data: conversas, error } = await getSupabase()
      .from('conversas_whatsapp')
      .select('id, telefone, nome_contato, foto_perfil_url')
      .or('foto_perfil_url.is.null,nome_contato.is.null,nome_contato.eq.Desconhecido')
      .order('ultimo_contato', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!conversas || conversas.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma conversa para atualizar',
        processados: 0,
        com_foto: 0,
        sem_foto: 0
      })
    }

    // Processar cada conversa com delay
    const resultados = {
      processados: conversas.length,
      com_foto: 0,
      sem_foto: 0,
      com_nome: 0,
      sem_nome: 0,
      atualizados: 0
    }

    for (const conversa of conversas) {
      try {
        await new Promise(r => setTimeout(r, 500))

        const info = await buscarInfoContato(conversa.telefone, config.api_key)
        
        if (!info) {
          resultados.sem_foto++
          resultados.sem_nome++
          continue
        }

        const updates: { nome_contato?: string; foto_perfil_url?: string } = {}

        if (info.nome && (!conversa.nome_contato || conversa.nome_contato === 'Desconhecido')) {
          updates.nome_contato = info.nome
          resultados.com_nome++
        } else {
          resultados.sem_nome++
        }

        if (info.foto && !conversa.foto_perfil_url) {
          updates.foto_perfil_url = info.foto
          resultados.com_foto++
        } else {
          resultados.sem_foto++
        }

        if (Object.keys(updates).length > 0) {
          await getSupabase()
            .from('conversas_whatsapp')
            .update(updates)
            .eq('id', conversa.id)
          
          resultados.atualizados++
        }

      } catch (err) {
        console.error(`Erro ao processar ${conversa.telefone}:`, err)
        resultados.sem_foto++
        resultados.sem_nome++
      }
    }

    return NextResponse.json({
      success: true,
      ...resultados
    })

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Verificar status/estatísticas (também requer autenticação)
export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const autenticado = await verificarAutenticacao(request)
    if (!autenticado) {
      return NextResponse.json(
        { error: 'Não autorizado. Envie a API key no header Authorization ou x-api-key.' },
        { status: 401 }
      )
    }

    // Contar conversas por status
    const { data: stats } = await getSupabase()
      .from('conversas_whatsapp')
      .select('id, nome_contato, foto_perfil_url')

    if (!stats) {
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    const total = stats.length
    const sem_foto = stats.filter(c => !c.foto_perfil_url).length
    const sem_nome = stats.filter(c => !c.nome_contato || c.nome_contato === 'Desconhecido').length
    const com_foto = total - sem_foto
    const com_nome = total - sem_nome

    return NextResponse.json({
      success: true,
      estatisticas: {
        total_conversas: total,
        com_foto: com_foto,
        sem_foto: sem_foto,
        com_nome: com_nome,
        sem_nome: sem_nome,
        precisam_sincronizar: Math.max(sem_foto, sem_nome)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
