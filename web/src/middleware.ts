import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que NÃO precisam de autenticação
const rotasPublicas = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/api/wasender/webhook', // Webhook tem sua própria autenticação
  '/api/wasender/sync-contacts', // Endpoint de sincronização de contatos
]

// Rotas de API que precisam de autenticação
const rotasApiProtegidas = [
  '/api/openai',
  '/api/upload',
  '/api/usuarios',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Criar response para poder modificar cookies
  const res = NextResponse.next()

  // Criar cliente Supabase
  const supabase = createMiddlewareClient({ req: request, res })

  // Verificar sessão
  const { data: { session } } = await supabase.auth.getSession()

  // Se é rota pública, permitir acesso
  if (rotasPublicas.some(rota => pathname.startsWith(rota))) {
    return res
  }

  // Se é página do dashboard e não está autenticado, redirecionar para login
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Se é API protegida e não está autenticado, retornar 401
  if (rotasApiProtegidas.some(rota => pathname.startsWith(rota))) {
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      )
    }
  }

  // Adicionar headers de segurança em todas as respostas
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return res
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    // Proteger todas as rotas do dashboard
    '/dashboard/:path*',
    // Proteger APIs específicas
    '/api/openai/:path*',
    '/api/upload/:path*',
    '/api/usuarios/:path*',
    // Não processar arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
