import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limiting para logs de segurança
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // máximo 10 logs por minuto por IP
const RATE_LIMIT_WINDOW = 60000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') || 
               'unknown'

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    }

    const body = await request.json()
    
    // Validar campos
    const { type, details, timestamp, url, userAgent } = body
    
    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Sanitizar dados antes de salvar
    const sanitizedLog = {
      tipo: 'security_violation',
      payload: JSON.stringify({
        violation_type: String(type).substring(0, 100),
        details: details ? JSON.stringify(details).substring(0, 500) : null,
        url: String(url || '').substring(0, 500),
        user_agent: String(userAgent || '').substring(0, 500),
        ip,
        timestamp: timestamp || new Date().toISOString()
      }),
      created_at: new Date().toISOString()
    }

    // Salvar no banco (se configurado)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await supabase
        .from('webhook_logs')
        .insert(sanitizedLog)
    }

    // Log no console do servidor para monitoramento
    console.warn(`[SECURITY] ${type} from ${ip}:`, details)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar log de segurança:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
