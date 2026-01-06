'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBadgeInline } from '@/components/ui/notification-badge'
import { PermissoesProvider } from '@/modules/auth'
import {
  Users, CreditCard, ShoppingCart, DoorOpen, MessageSquare, Vote, Settings, LayoutDashboard,
  LogOut, Menu, X, UserPlus, FileText, Building2, AlertTriangle, Stethoscope, Smartphone, 
  Bot, Sparkles, BadgeDollarSign, Dumbbell, ScanLine, Waves, Ticket, Receipt, Shield, Wallet, Tent, UserCog, Droplets, BarChart3, Bell, Columns3
} from 'lucide-react'

// Itens do menu com código da permissão
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissao: 'dashboard' },
  { href: '/dashboard/dashboard-clube', label: 'Dashboard Clube', icon: BarChart3, permissao: 'relatorios' },
  { href: '/dashboard/associados', label: 'Associados', icon: Users, permissao: 'associados' },
  { href: '/dashboard/dependentes', label: 'Dependentes', icon: UserPlus, permissao: 'dependentes' },
  { href: '/dashboard/planos', label: 'Planos/Categorias', icon: BadgeDollarSign, permissao: 'configuracoes' },
  { href: '/dashboard/academia', label: 'Academia', icon: Dumbbell, permissao: 'portaria' },
  { href: '/dashboard/academia-portaria', label: 'Portaria Academia', icon: ScanLine, permissao: 'portaria' },
  { href: '/dashboard/piscina-portaria', label: 'Portaria Piscina', icon: Waves, permissao: 'portaria' },
  { href: '/dashboard/convites', label: 'Convites', icon: Ticket, permissao: 'associados' },
  { href: '/dashboard/quiosques', label: 'Quiosques', icon: Tent, permissao: 'configuracoes' },
  { href: '/dashboard/exames-medicos', label: 'Exames Médicos', icon: Stethoscope, permissao: 'exames' },
  { href: '/dashboard/infracoes', label: 'Infrações', icon: AlertTriangle, permissao: 'infracoes' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: Wallet, permissao: 'financeiro' },
  { href: '/dashboard/carnes', label: 'Carnês', icon: Receipt, permissao: 'financeiro' },
  { href: '/dashboard/compras', label: 'Compras', icon: ShoppingCart, permissao: 'compras' },
  { href: '/dashboard/portaria', label: 'Portaria Clube', icon: DoorOpen, permissao: 'portaria' },
  { href: '/dashboard/portaria-sauna', label: 'Portaria Sauna', icon: Droplets, permissao: 'portaria_sauna' },
  { href: '/dashboard/configuracao-sauna', label: 'Config. Sauna', icon: Settings, permissao: 'configuracoes' },
  { href: '/dashboard/crm', label: 'CRM WhatsApp', icon: MessageSquare, permissao: 'crm', showNotification: true },
  { href: '/dashboard/whatsapp', label: 'Conexão WhatsApp', icon: Smartphone, permissao: 'crm' },
  { href: '/dashboard/respostas-automaticas', label: 'Respostas Auto', icon: Bot, permissao: 'crm' },
  { href: '/dashboard/kanban', label: 'Kanban', icon: Columns3, permissao: 'crm' },
  { href: '/dashboard/setores', label: 'Setores', icon: Building2, permissao: 'configuracoes' },
  { href: '/dashboard/bot-ia', label: 'Bot IA (GPT)', icon: Sparkles, permissao: 'crm' },
  { href: '/dashboard/eleicoes', label: 'Eleições', icon: Vote, permissao: 'eleicoes' },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText, permissao: 'relatorios' },
  { href: '/dashboard/relatorios-setores', label: 'Relatórios Setores', icon: FileText, permissao: 'relatorios' },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, permissao: 'usuarios', apenasAdmin: true },
  { href: '/dashboard/permissoes', label: 'Permissões', icon: Shield, permissao: 'usuarios', apenasAdmin: true },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, permissao: 'configuracoes', apenasAdmin: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissoes, setPermissoes] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Buscar mensagens não lidas do WhatsApp
  const fetchMensagensNaoLidas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select('nao_lidas')
        .gt('nao_lidas', 0)

      if (!error && data) {
        const total = data.reduce((acc, conv) => acc + (conv.nao_lidas || 0), 0)
        setMensagensNaoLidas(total)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error)
    }
  }, [supabase])

  useEffect(() => {
    const carregarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        router.push('/login')
        return 
      }
      setUser(user)

      // Buscar dados do usuário incluindo permissões
      const { data: userData } = await supabase
        .from('usuarios')
        .select('is_admin, nome, permissoes')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        setIsAdmin(userData.is_admin || false)
        setUserName(userData.nome || user.email?.split('@')[0] || 'Usuário')

        // Se é admin, tem acesso a tudo
        if (userData.is_admin) {
          setPermissoes([
            'dashboard', 'associados', 'dependentes', 'financeiro', 'compras',
            'portaria', 'exames', 'infracoes', 'eleicoes', 'relatorios',
            'crm', 'configuracoes', 'usuarios'
          ])
        } else {
          // Usar array de permissões do usuário
          setPermissoes(userData.permissoes || [])
        }
      }

      setLoading(false)
    }

    carregarUsuario()
  }, [router, supabase])

  // Monitorar mensagens não lidas em tempo real
  useEffect(() => {
    // Buscar inicial
    fetchMensagensNaoLidas()

    // Configurar Realtime para atualizações
    const channel = supabase
      .channel('whatsapp-menu-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas_whatsapp'
        },
        () => {
          fetchMensagensNaoLidas()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp',
          filter: 'direcao=eq.entrada'
        },
        (payload) => {
          console.log('🔔 Nova mensagem WhatsApp recebida!')
          fetchMensagensNaoLidas()
          
          // Tocar som de notificação
          try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.3
            audio.play().catch(() => {})
          } catch (e) {}

          // Mostrar notificação do navegador (se permitido)
          if (Notification.permission === 'granted') {
            new Notification('Nova mensagem WhatsApp', {
              body: 'Você recebeu uma nova mensagem',
              icon: '/icon-192.png'
            })
          }
        }
      )
      .subscribe()

    // Polling como fallback (a cada 30 segundos)
    const interval = setInterval(fetchMensagensNaoLidas, 30000)

    // Solicitar permissão de notificação
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase, fetchMensagensNaoLidas])

  const temPermissao = (permissao: string) => {
    if (isAdmin) return true
    return permissoes.includes(permissao)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filtrar menu baseado nas permissões
  const menuFiltrado = menuItems.filter(item => {
    // Se é página apenas para admin, verificar se é admin
    if (item.apenasAdmin && !isAdmin) return false
    // Verificar permissão normal
    return temPermissao(item.permissao)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Sistema Clube</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuFiltrado.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {/* Badge de notificação para CRM WhatsApp */}
              {item.showNotification && mensagensNaoLidas > 0 && (
                <NotificationBadgeInline 
                  count={mensagensNaoLidas} 
                  className={pathname === item.href ? "bg-white text-primary" : ""}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? '👑 Administrador' : user?.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-200",
        sidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {menuItems.find(item => item.href === pathname)?.label || 'Painel'}
            </h1>
          </div>

          {/* Indicador de novas mensagens no header */}
          {mensagensNaoLidas > 0 && (
            <Link 
              href="/dashboard/crm"
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
            >
              <Bell className="h-4 w-4 animate-bounce" />
              <span className="text-sm font-medium">
                {mensagensNaoLidas} {mensagensNaoLidas === 1 ? 'nova mensagem' : 'novas mensagens'}
              </span>
            </Link>
          )}

          {isAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Admin
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <PermissoesProvider>
            {children}
          </PermissoesProvider>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
