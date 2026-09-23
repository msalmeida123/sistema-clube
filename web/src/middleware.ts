import {fetchInterno} from '@/lib/supabase/fetch-interno'
import {verificarLicencaCliente} from '@/lib/gestao-licencas/cliente'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'
import { permiteRota } from '@/lib/permissao-rota'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/api/impressao-local/agente',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
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

  if(process.env.GESTAO_LICENCAS_ATIVA==='1'){
    if(pathname==='/'||pathname.startsWith('/dashboard'))return NextResponse.redirect(new URL('/gestao-clientes',req.url))
    const rotasCentrais=['/gestao-clientes/configuracoes','/api/gestao-clientes/configuracoes','/gestao-clientes','/api/gestao-clientes','/api/licencas/validar','/api/webhooks/asaas-licencas','/api/health','/login','/forgot-password','/reset-password','/auth/callback','/api/tema','/api/tema/icone','/api/tema/fundo-login','/api/tema/manifest','/favicon.ico']
    if(!rotasCentrais.includes(pathname)&&!pathname.startsWith('/_next/')&&!pathname.startsWith('/supabase/auth/v1/'))return new NextResponse('Não encontrado',{status:404})
  }

  // Executado antes do portal e do proxy Supabase: não basta esconder botões.
  // Instalações legadas permanecem inalteradas até LICENCA_EXIGIR=1.
  if (process.env.LICENCA_EXIGIR==='1' && pathname!=='/licenca-pendente' && pathname!=='/api/health' && !pathname.startsWith('/_next/') && pathname!=='/favicon.ico') {
    const licenca=await verificarLicencaCliente()
    if(licenca.status!==200){
      if(pathname.startsWith('/api/')||pathname.startsWith('/supabase/'))return NextResponse.json({error:licenca.status===402?'Licença pendente. Entre em contato com o fornecedor.':'Não foi possível verificar a licença. Tente novamente.'},{status:licenca.status,headers:{'Cache-Control':'no-store'}})
      return NextResponse.redirect(new URL('/licenca-pendente',req.url))
    }
  }

  if(pathname==='/licenca-pendente')return res
  // Autenticação por segredo de instalação; não usa sessão de operador.
  if(pathname==='/api/licencas/validar'&&req.method==='POST')return res
  // Estas rotas validam o proprietário permitido e a origem no handler.
  if(pathname==='/api/gestao-clientes'||pathname==='/api/gestao-clientes/configuracoes')return res

  if(req.method==='GET' && ['/api/tema','/api/tema/icone','/api/tema/fundo-login','/api/tema/manifest'].includes(pathname)) return res

  // O Supabase local valida as próprias chaves e sessões atrás deste proxy.
  if (process.env.NEXT_PUBLIC_SUPABASE_LOCAL_PROXY === '1' && pathname.startsWith('/supabase/')) {
    return res
  }

  // A consulta CNPJ valida sessão ativa e permissão no próprio handler.
  if(req.method==='GET' && /^\/api\/cnpj\/[A-Za-z0-9]{14}$/.test(pathname))return res

  // Estas rotas validam sessão, usuário ativo e autorização no próprio handler.
  // Correspondência exata: não dispensa autenticação de subrotas.
  if ((pathname === '/api/suporte' && ['GET','PUT'].includes(req.method)) ||
      (pathname === '/api/compras/uso-clube' && ['GET','POST'].includes(req.method))) return res

  if (['/api/associados/mensagens','/api/associados/notificacoes'].includes(pathname)) return res

  // Portal de associados usa sessão própria e não concede acesso administrativo.
  if (pathname === '/associado' || pathname.startsWith('/associado/') || pathname === '/api/associado-app' || pathname.startsWith('/api/associado-app/')) return res

  // Headers de segurança estão no next.config.js (fonte única)

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
    (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/') && pathname.includes('.')) // arquivos com extensão
  ) {
    return res
  }

  // Verifica autenticação para rotas protegidas
  try {
    const supabase = createMiddlewareClient({ req, res }, {options:{global:{fetch:fetchInterno}}})
    const { data: { session } } = await supabase.auth.getSession()

    // Se não autenticado, redireciona para login
    if (!session) {
      if(pathname.startsWith('/api/'))return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401})
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      const atual = await buscarUsuarioAtual<any>(supabase, user.id, 'ativo,is_admin')
      if (!atual?.ativo) return NextResponse.json({ error: 'Usuário inativo ou sem acesso.' }, { status: 403 })
      if (!atual.is_admin) {
        if (pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
          const { data, error } = await supabase.rpc('minhas_permissoes')
          if (error || !permiteRota(data || [], pathname)) return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        const segmento = pathname.split('/')[2]
        const modulos: Record<string,string> = { bar:'bar', associados:'associados', dependentes:'dependentes', convites:'convites', servicos:'servicos', financeiro:'financeiro', compras:'compras', 'exames-medicos':'exames', crm:'whatsapp' }
        // Atendimento valida a permissão por ação na própria API (clube, piscina ou exames).
        if (modulos[segmento] && pathname.startsWith('/api/') && pathname !== '/api/convites/atendimento') {
          const acao = ['GET','HEAD'].includes(req.method) || /impress|comprovante|atendimento/.test(pathname) ? 'visualizar' : req.method === 'DELETE' ? 'excluir' : req.method === 'POST' && (pathname.endsWith('/' + segmento) || pathname === '/api/compras/uso-clube') ? 'criar' : 'editar'
          const {data,error} = await supabase.rpc('sistema_pode', {codigo:modulos[segmento],acao})
          if (error || data !== true) return NextResponse.json({error:'Sem permissão para esta operação.'},{status:403})
        }
      }
    }
    // Usuário autenticado, continua
    return res
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error)
    if(pathname.startsWith('/api/'))return NextResponse.json({error:'Não foi possível verificar a sessão. Tente novamente.'},{status:503})
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
