'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Receipt, User, LogOut, Mail, Phone, CreditCard, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Associado = {
  nome: string
  cpf: string
  email: string
  telefone: string
  numero_titulo: string
  status: string
  plano?: { nome: string }
}

export default function PerfilPage() {
  const router = useRouter()
  const [associado, setAssociado] = useState<Associado | null>(null)

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

  const formatCPF = (cpf: string) => cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'
  const formatPhone = (tel: string) => {
    if (!tel) return '-'
    const nums = tel.replace(/\D/g, '')
    return nums.length === 11 ? nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : tel
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
      <div className="bg-gradient-to-br from-secondary to-purple-600 pt-safe-top pb-8 px-6">
        <div className="flex items-center gap-3 pt-4 mb-4">
          <Link href="/qrcode" className="text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">
              {associado.nome?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white font-semibold text-lg">{associado.nome}</h2>
          <p className="text-white/80 text-sm">Título: {associado.numero_titulo || '-'}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">CPF</p>
                <p className="font-medium text-gray-900">{formatCPF(associado.cpf)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="font-medium text-gray-900">{associado.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Telefone</p>
                <p className="font-medium text-gray-900">{formatPhone(associado.telefone)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Plano</p>
                <p className="font-medium text-gray-900">{associado.plano?.nome || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-6">
        <button
          onClick={handleLogout}
          className="w-full bg-danger text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </div>

      <p className="text-center text-gray-400 text-xs mt-6">Versão 1.0.0</p>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 safe-bottom">
        <div className="flex justify-around">
          <Link href="/qrcode" className="flex flex-col items-center py-2 text-gray-400">
            <QrCode size={24} />
            <span className="text-xs mt-1">QR Code</span>
          </Link>
          <Link href="/mensalidades" className="flex flex-col items-center py-2 text-gray-400">
            <Receipt size={24} />
            <span className="text-xs mt-1">Mensalidades</span>
          </Link>
          <div className="flex flex-col items-center py-2 text-primary">
            <User size={24} />
            <span className="text-xs mt-1 font-medium">Perfil</span>
          </div>
        </div>
      </div>
    </div>
  )
}
