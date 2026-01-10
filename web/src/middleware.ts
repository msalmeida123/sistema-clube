import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/webhooks',
  '/api/whatsapp-webhook',
  '/api/health',
  '/verificar-acesso'
]

// Rotas de API que usam autenticação própria
const apiRoutesWithOwnAuth = [
  '/api/webhooks',
  '/api/whatsapp-webhook',
  '/api/wasender/webhook'
]

// Gerar nonce único para CSP
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  const nonce = generateNonce()

  // ==========================================
  // HEADERS DE SEGURANÇA RIGOROSOS
  // ==========================================
  
  // Previne MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Previne clickjacking
  res.headers.set('X-Frame-Options', 'DENY')
  
  // Ativa proteção XSS do navegador
  res.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Controle de referrer
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Desabilita APIs perigosas
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // Força HTTPS
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Previne DNS prefetch abusivo
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // Não permite download de conteúdo em contexto diferente
  res.headers.set('X-Download-Options', 'noopen')
  
  // Isola o contexto do navegador
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  // ==========================================
  // CONTENT SECURITY POLICY (CSP) RIGOROSA
  // Bloqueia scripts inline, eval, e fontes não autorizadas
  // ==========================================
  const cspDirectives = [
    // Padrão: bloqueia tudo que não for explicitamente permitido
    "default-src 'self'",
    
    // Scripts: apenas do próprio domínio e CDNs confiáveis
    // BLOQUEIA: inline scripts, eval(), Function(), setTimeout com string
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://unpkg.com`,
    
    // Estilos: próprio domínio + inline necessário para componentes UI
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Imagens: próprio domínio + Supabase storage + WhatsApp
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://pps.whatsapp.net https://*.whatsapp.net",
    
    // Fontes
    "font-src 'self' https://fonts.gstatic.com",
    
    // Conexões: API própria + Supabase + OpenAI + WaSender
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://www.wasenderapi.com",
    
    // Frames: bloqueia todos
    "frame-src 'none'",
    "frame-ancestors 'none'",
    
    // Objetos: bloqueia Flash, Java, etc
    "object-src 'none'",
    
    // Base URI: apenas próprio domínio
    "base-uri 'self'",
    
    // Form actions: apenas próprio domínio
    "form-action 'self'",
    
    // Upgrade HTTP para HTTPS
    "upgrade-insecure-requests",
    
    // Bloqueia plugins
    "plugin-types 'none'",
    
    // Workers: apenas próprio domínio
    "worker-src 'self' blob:",
    
    // Manifests
    "manifest-src 'self'",
    
    // Media
    "media-src 'self' https://*.supabase.co blob:"
  ]
  
  res.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Salva o nonce para uso nos scripts
  res.headers.set('X-Nonce', nonce)

  // Permite rotas de API com autenticação própria
  if (apiRoutesWithOwnAuth.some(route => pathname.startsWith(route))) {
    return res
  }

  // Permite rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res
  }

  // Permite arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return res
  }

  // Verifica autenticação para rotas protegidas
  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Se não autenticado, redireciona para login
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Usuário autenticado, continua
    return res
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
