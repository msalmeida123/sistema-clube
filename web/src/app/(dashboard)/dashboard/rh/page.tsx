'use client'

import { useState } from 'react'
import { PaginaProtegida } from '@/components/ui/permissao'
import { Users, Clock, DollarSign, Palmtree, LayoutDashboard } from 'lucide-react'
import { useRHStats } from '@/modules/rh'
import { RHDashboard } from '@/modules/rh/components/RHDashboard'
import { FuncionariosTab } from '@/modules/rh/components/FuncionariosTab'
import { PontoTab } from '@/modules/rh/components/PontoTab'
import { FolhaTab } from '@/modules/rh/components/FolhaTab'
import { AfastamentosTab } from '@/modules/rh/components/AfastamentosTab'

type Tab = 'dashboard' | 'funcionarios' | 'ponto' | 'folha' | 'afastamentos'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'funcionarios', label: 'Funcionários', icon: Users },
  { id: 'ponto', label: 'Ponto', icon: Clock },
  { id: 'folha', label: 'Folha de Pagamento', icon: DollarSign },
  { id: 'afastamentos', label: 'Férias / Afastamentos', icon: Palmtree },
]

export default function RHPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { stats, loading: statsLoading } = useRHStats()

  return (
    <PaginaProtegida setoresPermitidos={['admin']}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Recursos Humanos</h1>
          <p className="text-sm text-gray-500">Gestão de funcionários, ponto, folha e afastamentos</p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === 'dashboard' && <RHDashboard stats={stats} loading={statsLoading} />}
          {tab === 'funcionarios' && <FuncionariosTab />}
          {tab === 'ponto' && <PontoTab />}
          {tab === 'folha' && <FolhaTab />}
          {tab === 'afastamentos' && <AfastamentosTab />}
        </div>
      </div>
    </PaginaProtegida>
  )
}
