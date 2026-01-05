'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF deve ter 11 dígitos')
      return
    }
    if (senha.length < 4) {
      setError('Digite sua senha')
      return
    }

    setLoading(true)

    try {
      // Buscar associado pelo CPF
      const { data: associado, error: assocError } = await supabase
        .from('associados')
        .select('*, plano:planos(nome, valor)')
        .eq('cpf', cpfLimpo)
        .single()

      if (assocError || !associado) {
        setError('CPF não encontrado')
        setLoading(false)
        return
      }

      if (!associado.email) {
        setError('Associado sem email cadastrado')
        setLoading(false)
        return
      }

      // Login com Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: associado.email,
        password: senha,
      })

      if (authError) {
        setError('Senha incorreta')
        setLoading(false)
        return
      }

      // Salvar dados do associado
      localStorage.setItem('associado', JSON.stringify(associado))
      router.replace('/qrcode')
    } catch (err) {
      setError('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-primary to-secondary pt-safe-top pb-12 px-6 rounded-b-[30px]">
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-4">
            <Shield className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Clube do Associado</h1>
          <p className="text-white/80 text-sm mt-1">Acesse sua área exclusiva</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bem-vindo!</h2>
          <p className="text-gray-500 text-sm mb-6">Entre com seu CPF e senha</p>

          <form onSubmit={handleLogin}>
            {/* CPF */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {/* Senha */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Esqueci senha */}
            <Link href="/recuperar-senha" className="block text-right text-primary text-sm font-medium mb-6">
              Esqueci minha senha
            </Link>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <p className="text-center text-gray-400 text-xs mt-6 px-4">
          Sua primeira senha é enviada por email ao se cadastrar no clube
        </p>
      </div>
    </div>
  )
}
