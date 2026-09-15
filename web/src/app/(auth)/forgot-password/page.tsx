'use client'
import {useState} from 'react'
import Link from 'next/link'
import {createClientComponentClient} from '@/lib/supabase/client'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from '@/components/ui/card'
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[enviado,setEnviado]=useState(false),[erro,setErro]=useState('')
 const [supabase]=useState(()=>createClientComponentClient())
 async function enviar(e:React.FormEvent){
  e.preventDefault();setBusy(true);setErro('')
  try{
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+'/reset-password'})
   if(error){
    if(error.status===429){setErro('Aguarde alguns minutos antes de solicitar outro link.');return}
    if(error.status&&error.status>=500)throw Error('O envio de e-mail está indisponível. Entre em contato com o administrador.')
    if(!error.status)throw Error('Não foi possível conectar. Confira sua conexão e tente novamente.')
   }
   setEnviado(true)
  }catch(e:any){setErro(e.message||'Não foi possível solicitar a recuperação.')}
  finally{setBusy(false)}
 }
 return <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><Card className="w-full max-w-md">
  <CardHeader><CardTitle>Recuperar senha</CardTitle><CardDescription>Informe o e-mail da sua conta de acesso ao Sistema Clube.</CardDescription></CardHeader>
  <CardContent className="space-y-5">
   {enviado?<p role="status">Se este e-mail possuir uma conta, você receberá um link para definir uma nova senha. Confira também a pasta de spam. Use o link mais recente.</p>:<form onSubmit={enviar} className="space-y-4">
    <div className="space-y-2"><Label htmlFor="email">E-mail cadastrado</Label><Input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></div>
    {erro&&<p role="alert" className="text-sm text-red-700">{erro}</p>}
    <Button type="submit" disabled={busy} className="w-full">{busy?'Solicitando...':'Enviar link de recuperação'}</Button>
   </form>}
   <Link className="block text-sm text-blue-700 underline" href="/login">Voltar para entrar</Link>
  </CardContent>
 </Card></main>
}
