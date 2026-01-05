'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Key, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function RecuperarSenhaPage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('Digite um CPF válido')
      return
    }

    setLoading(true)

    try {
      const { data: associado } = await supabase
        .from('associados')
        .select('email, nome')
        .eq('cpf', cpfLimpo)
        .single()

      if (!associado?.email) {
        setError('CPF não encontrado ou sem email cadastrado')
        setLoading(false)
        return
      }

      await supabase.auth.resetPasswordForEmail(associado.email)
      
      // Mascarar email
      const emailMascarado = associado.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      setEmail(emailMascarado)
      setSuccess(true)
    } catch {
      setError('Erro ao enviar email')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-gradient-to-br from-success to-emerald-600 pt-safe-top pb-12 px-6 rounded-b-[30px]">
          <div className="flex flex-col items-center pt-8 pb-4">
            <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-4">
              <Mail className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email Enviado!</h1>
            <p className="text-white/80 text-sm mt-1">Verifique sua caixa de entrada</p>
          </div>
        </div>

        <div className="flex-1 px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tudo certo!</h2>
            <p className="text-gray-500 mb-2">Enviamos um link de recuperação para:</p>
            <p className="text-primary font-semibold text-lg mb-4">{email}</p>
            <p className="text-gray-400 text-sm mb-6">
              Clique no link do email para criar uma nova senha. O link expira em 1 hora.
            </p>
            <Link
              href="/login"
              className="block w-full bg-primary text-white py-4 rounded-xl font-semibold"
            >
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-warning to-orange-500 pt-safe-top pb-12 px-6 rounded-b-[30px]">
        <Link href="/login" className="flex items-center gap-2 text-white pt-4 mb-4">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex flex-col items-center pb-4">
          <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-4">
            <Key className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Esqueceu a Senha?</h1>
          <p className="text-white/80 text-sm mt-1">Vamos te ajudar a recuperar</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
          <p className="text-gray-500 text-sm mb-6">
            Digite seu CPF e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-warning focus:ring-2 focus:ring-warning/20 outline-none transition"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-warning text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Email de Recuperação'
              )}
            </button>

            <Link href="/login" className="block text-center text-gray-400 mt-4">
              Voltar para Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
