import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

// GET - Buscar status da sessão
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: config, error: configError } = await supabase
      .from('config_wasender')
      .select('*')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração não encontrada. Vá em Configurações > WaSenderAPI', 
        device_id: null 
      }, { status: 400 })
    }

    if (!config.personal_token) {
      return NextResponse.json({ 
        error: 'Personal Access Token não configurado', 
        device_id: config.device_id 
      }, { status: 400 })
    }

    if (!config.device_id) {
      return NextResponse.json({ 
        error: 'Device ID não configurado', 
        device_id: null 
      }, { status: 400 })
    }

    // Usar Personal Access Token para gerenciar sessões
    try {
      const response = await fetch(`https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.personal_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      console.log('WaSender Session Details:', result)

      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          session: result.data || result,
          device_id: config.device_id
        })
      }

      return NextResponse.json({ 
        success: true, 
        session: { status: 'disconnected' },
        device_id: config.device_id,
        apiError: result
      })

    } catch (apiError: any) {
      console.error('Erro na API WaSender:', apiError)
      return NextResponse.json({ 
        success: true, 
        session: { status: 'unknown' },
        device_id: config.device_id,
        error: apiError.message
      })
    }

  } catch (error: any) {
    console.error('Erro ao buscar sessão:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Ações da sessão (connect, QR Code, desconectar, reiniciar)
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { action } = await request.json()
    
    const { data: config } = await supabase
      .from('config_wasender')
      .select('*')
      .single()

    if (!config?.personal_token || !config?.device_id) {
      return NextResponse.json({ error: 'Configure o Personal Access Token em Configurações' }, { status: 400 })
    }

    let endpoint = ''
    let method = 'POST'

    switch (action) {
      case 'connect':
        endpoint = `https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}/connect`
        break
      case 'qrcode':
        endpoint = `https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}/qrcode`
        method = 'GET'
        break
      case 'disconnect':
        endpoint = `https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}/disconnect`
        break
      case 'restart':
        endpoint = `https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}/restart`
        break
      case 'status':
        endpoint = `https://www.wasenderapi.com/api/whatsapp-sessions/${config.device_id}`
        method = 'GET'
        break
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    console.log('Chamando WaSender:', endpoint, method)

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${config.personal_token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    console.log('WaSender Response:', result)

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.message || result.error || 'Erro na operação',
        details: result 
      }, { status: response.status })
    }

    // Para QR Code - converter string para imagem base64
    if (action === 'qrcode') {
      const qrData = result.data?.qrCode || result.data?.qr || result.qrCode || result.qr
      
      if (qrData) {
        try {
          // Gerar imagem PNG do QR Code
          const qrImageBase64 = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
          
          return NextResponse.json({ 
            success: true, 
            data: { qr: qrImageBase64 }
          })
        } catch (qrError) {
          console.error('Erro ao gerar QR Code:', qrError)
          return NextResponse.json({ 
            success: true, 
            data: { qr: qrData } // Retorna o dado bruto se falhar
          })
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        data: { qr: null }
      })
    }

    return NextResponse.json({ success: true, data: result.data || result })

  } catch (error: any) {
    console.error('Erro na operação:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
