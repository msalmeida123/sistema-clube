'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QrCode, Receipt, User, LogOut, CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Mensalidade = {
  id: string
  mes_referencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
}

export default function MensalidadesPage() {
  const router = useRouter()
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas'>('todas')

  useEffect(() => {
    const data = localStorage.getItem('associado')
    if (!data) {
      router.replace('/login')
      return
    }
    const associado = JSON.parse(data)
    carregarMensalidades(associado.id)
  }, [router])

  const carregarMensalidades = async (associadoId: string) => {
    const { data } = await supabase
      .from('mensalidades')
      .select('*')
      .eq('associado_id', associadoId)
      .order('data_vencimento', { ascending: false })
      .limit(24)

    setMensalidades(data || [])
    setLoading(false)
  }

  const formatarMes = (mesRef: string) => {
    const [ano, mes] = mesRef.split('-')
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')
  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const getStatusConfig = (status: string, dataVenc: string) => {
    const isVencido = new Date(dataVenc) < new Date() && status === 'pendente'
    if (status === 'pago') return { color: 'text-success bg-success/10', icon: CheckCircle, text: 'Pago' }
    if (isVencido || status === 'atrasado') return { color: 'text-danger bg-danger/10', icon: AlertCircle, text: 'Atrasado' }
    return { color: 'text-warning bg-warning/10', icon: Clock, text: 'Pendente' }
  }

  const mensalidadesFiltradas = mensalidades.filter(m => {
    if (filtro === 'pendentes') return m.status === 'pendente' || m.status === 'atrasado'
    if (filtro === 'pagas') return m.status === 'pago'
    return true
  })

  const totalPendente = mensalidades
    .filter(m => m.status !== 'pago')
    .reduce((acc, m) => acc + m.valor, 0)

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-success to-emerald-600 pt-safe-top pb-8 px-6">
        <div className="flex items-center gap-3 pt-4 mb-4">
          <Link href="/qrcode" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white">Mensalidades</h1>
        </div>
        
        {totalPendente > 0 && (
          <div className="bg-white/20 rounded-xl p-4">
            <p className="text-white/80 text-sm">Total Pendente</p>
            <p className="text-white text-2xl font-bold">{formatarValor(totalPendente)}</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 flex gap-2">
        {(['todas', 'pendentes', 'pagas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === f 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-6 flex-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : mensalidadesFiltradas.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-400">Nenhuma mensalidade encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mensalidadesFiltradas.map((m) => {
              const config = getStatusConfig(m.status, m.data_vencimento)
              const Icon = config.icon
              return (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{formatarMes(m.mes_referencia)}</p>
                      <p className="text-gray-400 text-xs">Venc: {formatarData(m.data_vencimento)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.color}`}>
                      <Icon size={14} />
                      <span className="text-xs font-medium">{config.text}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <p className="text-xl font-bold text-gray-900">{formatarValor(m.valor)}</p>
                    {m.data_pagamento && (
                      <p className="text-success text-xs">Pago em {formatarData(m.data_pagamento)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 safe-bottom">
        <div className="flex justify-around">
          <Link href="/qrcode" className="flex flex-col items-center py-2 text-gray-400">
            <QrCode size={24} />
            <span className="text-xs mt-1">QR Code</span>
          </Link>
          <div className="flex flex-col items-center py-2 text-primary">
            <Receipt size={24} />
            <span className="text-xs mt-1 font-medium">Mensalidades</span>
          </div>
          <Link href="/perfil" className="flex flex-col items-center py-2 text-gray-400">
            <User size={24} />
            <span className="text-xs mt-1">Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
