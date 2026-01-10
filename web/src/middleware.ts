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
  '/api/whatsapp-webhook'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Headers de segurança
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
