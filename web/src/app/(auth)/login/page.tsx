'use client'
import styles from './login.module.css'
import {Mail, LockKeyhole, Eye, EyeOff, ArrowRight} from 'lucide-react'
import {FundoLogin} from '@/components/FundoLogin'
import {RodapeDesenvolvedor} from '@/components/RodapeDesenvolvedor'
import {IconeClube} from '@/components/providers/tema-provider'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ title: 'Login realizado!', description: 'Redirecionando...' })
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast({ title: 'Erro no login', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <FundoLogin className={styles.scene}/>
      {/* Painel inspirado na ilustração: campos reais, sem repetir o formulário do fundo. */}
      <section className={styles.panel} aria-labelledby="login-title">
        <header className={styles.header}>
          <div className={styles.logo}><IconeClube className="h-14 w-14"/></div>
          <h1 id="login-title">Sistema de Clube</h1>
          <p>Entre com suas credenciais</p>
        </header>
        <form onSubmit={handleLogin} className={styles.form} aria-busy={loading}>
          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <div className={styles.inputLine}>
              <Mail aria-hidden="true" size={20}/>
              <input id="email" name="email" type="email" autoComplete="username" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputLine}>
              <LockKeyhole aria-hidden="true" size={20}/>
              <input id="password" name="password" type={mostrarSenha?'text':'password'} autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)} required/>
              <button type="button" className={styles.eye} aria-label={mostrarSenha?'Ocultar senha':'Mostrar senha'} aria-pressed={mostrarSenha} onClick={()=>setMostrarSenha(!mostrarSenha)}>{mostrarSenha?<EyeOff aria-hidden="true" size={20}/>:<Eye aria-hidden="true" size={20}/>}</button>
            </div>
          </div>
          <button type="submit" className={styles.submit} disabled={loading}>{loading?'Entrando…':<>Entrar <ArrowRight aria-hidden="true" size={18}/></>}</button>
        </form>
        <Link href="/forgot-password" className={styles.forgot}>Esqueci minha senha</Link>
        <div className={styles.credit}><RodapeDesenvolvedor/></div>
      </section>
    </main>
  )
}
