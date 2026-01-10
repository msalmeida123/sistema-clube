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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // ==========================================
  // HEADERS DE SEGURANÇA BÁSICOS
  // ==========================================
  
  // Previne MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Previne clickjacking
  res.headers.set('X-Frame-Options', 'DENY')
  
  // Ativa proteção XSS do navegador
  res.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Controle de referrer
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Força HTTPS
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

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
