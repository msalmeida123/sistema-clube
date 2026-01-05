'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Receipt, User, LogOut, CheckCircle, Sun } from 'lucide-react'
import Link from 'next/link'

type Associado = {
  id: string
  nome: string
  cpf: string
  numero_titulo: string
  qr_code: string
  status: string
  plano?: { nome: string }
}

export default function QRCodePage() {
  const router = useRouter()
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [brightness, setBrightness] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem('associado')
    if (data) {
      setAssociado(JSON.parse(data))
    } else {
      router.replace('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('associado')
    router.replace('/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-success'
      case 'inativo': return 'bg-danger'
      default: return 'bg-warning'
    }
  }

  if (!associado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary pt-safe-top pb-6 px-6">
        <div className="flex justify-between items-start pt-4">
          <div>
            <p className="text-white/80 text-sm">Olá,</p>
            <h1 className="text-xl font-bold text-white">{associado.nome?.split(' ')[0]}! 👋</h1>
          </div>
          <div className={`${getStatusColor(associado.status)} px-3 py-1 rounded-full`}>
            <span className="text-white text-xs font-semibold capitalize">{associado.status}</span>
          </div>
        </div>
      </div>

      {/* Card QR Code */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <QRCodeSVG value="icon" size={16} className="text-primary" />
            </div>
            <h2 className="font-semibold text-gray-900">Seu Cartão Digital</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Apresente este QR Code na portaria para acessar o clube
          </p>

          {/* QR Code */}
          <div
            className={`flex justify-center p-6 rounded-2xl transition-all ${brightness ? 'bg-white shadow-lg shadow-primary/20' : 'bg-gray-50'}`}
            onClick={() => setBrightness(!brightness)}
          >
            <QRCodeSVG
              value={associado.qr_code || associado.id}
              size={220}
              level="H"
              includeMargin
            />
          </div>

          {/* Info */}
          <div className="flex justify-around mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Título</p>
              <p className="font-semibold text-gray-900">{associado.numero_titulo || '-'}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Plano</p>
              <p className="font-semibold text-gray-900">{associado.plano?.nome || '-'}</p>
            </div>
          </div>

          {/* Dica de brilho */}
          <button
            onClick={() => setBrightness(!brightness)}
            className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-4 w-full"
          >
            <Sun size={14} />
            {brightness ? 'Toque para diminuir brilho' : 'Toque no QR para aumentar brilho'}
          </button>
        </div>
      </div>

      {/* Dicas */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Dicas</h3>
          <div className="space-y-2">
            {['Mantenha o celular com brilho alto', 'Aproxime o QR Code do leitor', 'Funciona mesmo sem internet'].map((tip, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-gray-600 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 safe-bottom">
        <div className="flex justify-around">
          <div className="flex flex-col items-center py-2 text-primary">
            <QRCodeSVG value="tab" size={24} />
            <span className="text-xs mt-1 font-medium">QR Code</span>
          </div>
          <Link href="/mensalidades" className="flex flex-col items-center py-2 text-gray-400">
            <Receipt size={24} />
            <span className="text-xs mt-1">Mensalidades</span>
          </Link>
          <Link href="/perfil" className="flex flex-col items-center py-2 text-gray-400">
            <User size={24} />
            <span className="text-xs mt-1">Perfil</span>
          </Link>
          <button onClick={handleLogout} className="flex flex-col items-center py-2 text-gray-400">
            <LogOut size={24} />
            <span className="text-xs mt-1">Sair</span>
          </button>
        </div>
      </div>
    </div>
  )
}
