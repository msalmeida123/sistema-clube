'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Users, CreditCard, ShoppingCart, DoorOpen, MessageSquare, Vote, Settings, LayoutDashboard,
  LogOut, Menu, X, UserPlus, FileText, Building2, AlertTriangle, Stethoscope, Smartphone, 
  Bot, Sparkles, BadgeDollarSign, Dumbbell, ScanLine, Waves, Ticket, Receipt, Shield, Wallet, Tent
} from 'lucide-react'

// Itens do menu com código da página
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, codigo: 'dashboard' },
  { href: '/dashboard/associados', label: 'Associados', icon: Users, codigo: 'associados' },
  { href: '/dashboard/dependentes', label: 'Dependentes', icon: UserPlus, codigo: 'dependentes' },
  { href: '/dashboard/planos', label: 'Planos/Categorias', icon: BadgeDollarSign, codigo: 'planos' },
  { href: '/dashboard/academia', label: 'Academia', icon: Dumbbell, codigo: 'academia' },
  { href: '/dashboard/academia-portaria', label: 'Portaria Academia', icon: ScanLine, codigo: 'portaria_academia' },
  { href: '/dashboard/piscina-portaria', label: 'Portaria Piscina', icon: Waves, codigo: 'portaria_piscina' },
  { href: '/dashboard/convites', label: 'Convites', icon: Ticket, codigo: 'convites' },
  { href: '/dashboard/quiosques', label: 'Quiosques', icon: Tent, codigo: 'quiosques' },
  { href: '/dashboard/exames-medicos', label: 'Exames Médicos', icon: Stethoscope, codigo: 'exames' },
  { href: '/dashboard/infracoes', label: 'Infrações', icon: AlertTriangle, codigo: 'infracoes' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: Wallet, codigo: 'financeiro' },
  { href: '/dashboard/carnes', label: 'Carnês', icon: Receipt, codigo: 'carnes' },
  { href: '/dashboard/compras', label: 'Compras', icon: ShoppingCart, codigo: 'compras' },
  { href: '/dashboard/portaria', label: 'Portaria Clube', icon: DoorOpen, codigo: 'portaria' },
  { href: '/dashboard/crm', label: 'CRM WhatsApp', icon: MessageSquare, codigo: 'whatsapp' },
  { href: '/dashboard/whatsapp', label: 'Conexão WhatsApp', icon: Smartphone, codigo: 'whatsapp_conexao' },
  { href: '/dashboard/respostas-automaticas', label: 'Respostas Auto', icon: Bot, codigo: 'whatsapp_respostas' },
  { href: '/dashboard/bot-ia', label: 'Bot IA (GPT)', icon: Sparkles, codigo: 'whatsapp_bot' },
  { href: '/dashboard/eleicoes', label: 'Eleições', icon: Vote, codigo: 'eleicoes' },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText, codigo: 'relatorios' },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: Users, codigo: 'usuarios' },
  { href: '/dashboard/permissoes', label: 'Permissões', icon: Shield, codigo: 'permissoes', apenasAdmin: true },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, codigo: 'configuracoes', apenasAdmin: true },
]

type Permissao = {
  codigo: string
  pode_visualizar: boolean
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const carregarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        router.push('/login')
        return 
      }
      setUser(user)

      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('is_admin, nome, perfil_acesso_id')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        setIsAdmin(userData.is_admin || false)
        setUserName(userData.nome || user.email?.split('@')[0] || 'Usuário')

        // Se é admin, tem acesso a tudo
        if (userData.is_admin) {
          const todasPermissoes: Record<string, Permissao> = {}
          menuItems.forEach(item => {
            todasPermissoes[item.codigo] = { codigo: item.codigo, pode_visualizar: true }
          })
          setPermissoes(todasPermissoes)
        } else {
          // Carregar permissões do banco
          await carregarPermissoes(user.id, userData.perfil_acesso_id)
        }
      }

      setLoading(false)
    }

    carregarUsuario()
  }, [router, supabase])

  const carregarPermissoes = async (userId: string, perfilId: string | null) => {
    // Carregar páginas
    const { data: paginas } = await supabase
      .from('paginas_sistema')
      .select('id, codigo')

    const paginasMap: Record<string, string> = {}
    ;(paginas || []).forEach(p => {
      paginasMap[p.id] = p.codigo
    })

    const permissoesMap: Record<string, Permissao> = {}

    // Carregar permissões do perfil
    if (perfilId) {
      const { data: permissoesPerfil } = await supabase
        .from('permissoes_perfil')
        .select('pagina_id, pode_visualizar')
        .eq('perfil_id', perfilId)

      ;(permissoesPerfil || []).forEach(p => {
        const codigo = paginasMap[p.pagina_id]
        if (codigo) {
          permissoesMap[codigo] = { codigo, pode_visualizar: p.pode_visualizar }
        }
      })
    }

    // Carregar permissões individuais (sobrescrevem as do perfil)
    const { data: permissoesUsuario } = await supabase
      .from('permissoes_usuario')
      .select('pagina_id, pode_visualizar')
      .eq('usuario_id', userId)

    ;(permissoesUsuario || []).forEach(p => {
      const codigo = paginasMap[p.pagina_id]
      if (codigo) {
        permissoesMap[codigo] = { codigo, pode_visualizar: p.pode_visualizar }
      }
    })

    setPermissoes(permissoesMap)
  }

  const temPermissao = (codigo: string) => {
    if (isAdmin) return true
    return permissoes[codigo]?.pode_visualizar || false
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
    return temPermissao(item.codigo)
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
              <item.icon className="h-5 w-5" />
              {item.label}
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

          {isAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Admin
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
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
