'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  MessageSquare,
  Shield,
  Settings,
  QrCode,
  LogOut,
  Bot,
  Sparkles,
  Columns3,
  Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/associados', label: 'Associados', icon: Users, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'secretaria'] },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'financeiro'] },
  { href: '/compras', label: 'Compras', icon: ShoppingCart, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'financeiro'] },
  { href: '/portaria', label: 'Portaria', icon: QrCode, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'portaria_clube', 'portaria_piscina', 'portaria_academia'] },
  { href: '/dashboard/crm', label: 'WhatsApp CRM', icon: MessageSquare, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
  { href: '/dashboard/kanban', label: 'Kanban', icon: Columns3, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
  { href: '/dashboard/setores', label: 'Setores', icon: Building2, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/dashboard/respostas-automaticas', label: 'Respostas Auto', icon: Bot, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
  { href: '/dashboard/bot-ia', label: 'Bot IA (GPT)', icon: Sparkles, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  userRole?: string
}

export default function Sidebar({ userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Sistema Clube</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
