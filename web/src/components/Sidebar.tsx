'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  Building2,
  UserCog,
  ChevronDown,
  ChevronRight,
  Cog,
  History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Versão atual
const VERSION = '1.5.0'

// Itens principais do menu
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/associados', label: 'Associados', icon: Users, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'secretaria'] },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'financeiro'] },
  { href: '/compras', label: 'Compras', icon: ShoppingCart, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'financeiro'] },
  { href: '/portaria', label: 'Portaria', icon: QrCode, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'portaria_clube', 'portaria_piscina', 'portaria_academia'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
]

// Itens do WhatsApp CRM
const whatsappItems = [
  { href: '/dashboard/crm', label: 'Conversas', icon: MessageSquare, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
  { href: '/dashboard/kanban', label: 'Kanban', icon: Columns3, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
]

// Configurações do WhatsApp CRM
const whatsappConfigItems = [
  { href: '/dashboard/setores', label: 'Setores', icon: Building2, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/dashboard/setores-usuarios', label: 'Setores Usuários', icon: UserCog, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
  { href: '/dashboard/respostas-automaticas', label: 'Respostas Auto', icon: Bot, roles: ['admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento'] },
  { href: '/dashboard/bot-ia', label: 'Bot IA (GPT)', icon: Sparkles, roles: ['admin', 'presidente', 'vice_presidente', 'diretor'] },
]

interface SidebarProps {
  userRole?: string
}

export default function Sidebar({ userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [whatsappExpanded, setWhatsappExpanded] = useState(true)
  const [configExpanded, setConfigExpanded] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))
  const filteredWhatsapp = whatsappItems.filter(item => item.roles.includes(userRole))
  const filteredWhatsappConfig = whatsappConfigItems.filter(item => item.roles.includes(userRole))

  // Verificar se algum item do WhatsApp está ativo
  const isWhatsappActive = [...whatsappItems, ...whatsappConfigItems].some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Verificar se algum item de config está ativo
  const isConfigActive = whatsappConfigItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Sistema Clube</h1>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {/* Menu principal (antes do WhatsApp) */}
          {filteredMenu.slice(0, 5).map((item) => {
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

          {/* Seção WhatsApp CRM */}
          {(filteredWhatsapp.length > 0 || filteredWhatsappConfig.length > 0) && (
            <li className="pt-2">
              <button
                onClick={() => setWhatsappExpanded(!whatsappExpanded)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition ${
                  isWhatsappActive && !whatsappExpanded
                    ? 'bg-green-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} className="text-green-400" />
                  <span className="font-medium">WhatsApp CRM</span>
                </div>
                {whatsappExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>

              {whatsappExpanded && (
                <ul className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-2">
                  {/* Itens principais do WhatsApp */}
                  {filteredWhatsapp.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                            isActive 
                              ? 'bg-green-600 text-white' 
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}

                  {/* Subseção de Configurações do WhatsApp */}
                  {filteredWhatsappConfig.length > 0 && (
                    <li className="pt-1">
                      <button
                        onClick={() => setConfigExpanded(!configExpanded)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition text-sm ${
                          isConfigActive && !configExpanded
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Cog size={16} />
                          <span>Configurações</span>
                        </div>
                        {configExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>

                      {configExpanded && (
                        <ul className="mt-1 ml-3 space-y-1 border-l border-gray-700 pl-2">
                          {filteredWhatsappConfig.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            const Icon = item.icon

                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded transition text-xs ${
                                    isActive 
                                      ? 'bg-gray-700 text-white' 
                                      : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                                  }`}
                                >
                                  <Icon size={14} />
                                  <span>{item.label}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </li>
          )}

          {/* Configurações do sistema (último item) */}
          {filteredMenu.slice(5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.href} className="pt-2">
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

      {/* Footer com versão e logout */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/dashboard/versao"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm ${
            pathname === '/dashboard/versao'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <History size={18} />
          <span>Versão {VERSION}</span>
        </Link>
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
