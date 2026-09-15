'use client'
import {useEffect,useState,useRef} from 'react'
import Link from 'next/link'
import {criarClienteRecuperacao} from '@/lib/supabase/recuperacao'
import {validatePassword} from '@/lib/security'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from '@/components/ui/card'
export default function ResetPasswordPage(){
 const [supabase]=useState(()=>criarClienteRecuperacao())
 const iniciou=useRef(false)
 const [token,setToken]=useState(''),[code,setCode]=useState(''),[pronto,setPronto]=useState(false),[validado,setValidado]=useState(false)
 const [password,setPassword]=useState(''),[confirmacao,setConfirmacao]=useState(''),[busy,setBusy]=useState(false),[erro,setErro]=useState(''),[sucesso,setSucesso]=useState(false)
 useEffect(()=>{
  if(iniciou.current)return;iniciou.current=true
  const url=new URL(window.location.href),hash=new URLSearchParams(url.hash.slice(1))
  setToken(hash.get('token_hash')||'');setCode(url.searchParams.get('code')||'')
  if(url.searchParams.has('error')||hash.has('error'))setErro('Link inválido ou expirado. Solicite outro link.')
  window.history.replaceState(window.history.state,'','/reset-password')
  setPronto(true)
 },[])
 async function salvar(e:React.FormEvent){
  e.preventDefault();setErro('')
  if(password!==confirmacao){setErro('As senhas não coincidem.');return}
  const validacao=validatePassword(password)
  if(password.length<8||password.length>128||!validacao.valid){setErro('Use de 8 a 128 caracteres e evite senhas comuns.');return}
  setBusy(true)
  try{
   if(!validado){
    const result=token?await supabase.auth.verifyOtp({token_hash:token,type:'recovery'}):await supabase.auth.exchangeCodeForSession(code)
    if(result.error||!result.data.user||!result.data.session)throw Error('Link inválido, expirado ou já utilizado. Solicite outro link.')
    if(!token&&(result.data as any).redirectType!=='recovery')throw Error('Este link não é de recuperação de senha.')
    setValidado(true);setToken('');setCode('')
   }
   const {error}=await supabase.auth.updateUser({password})
   if(error)throw Error('Não foi possível salvar. Escolha uma senha diferente da anterior e tente novamente.')
   const {error:saida}=await supabase.auth.signOut({scope:'global'})
   setPassword('');setConfirmacao('');setSucesso(true)
   if(saida)setErro('Senha alterada. Não foi possível encerrar todas as sessões; saia do sistema neste dispositivo.')
  }catch(e:any){setErro(e.message||'Não foi possível atualizar a senha.')}
  finally{setBusy(false)}
 }
 const temLink=!!token||!!code||validado
 return <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4"><Card className="w-full max-w-md">
  <CardHeader><CardTitle>{sucesso?'Senha alterada':'Definir nova senha'}</CardTitle><CardDescription>O link de recuperação é pessoal e pode ser usado uma única vez.</CardDescription></CardHeader>
  <CardContent className="space-y-4">
   {!pronto?<p>Verificando link...</p>:sucesso?<p role="status">Sua senha foi atualizada. Entre novamente com a nova senha.</p>:!temLink?<p role="alert">Abra o link recebido por e-mail. Se ele expirou ou já foi usado, solicite outro.</p>:<form onSubmit={salvar} className="space-y-4">
    <div className="space-y-2"><Label htmlFor="nova-senha">Nova senha</Label><Input id="nova-senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/><p className="text-xs text-slate-600">Pelo menos 8 caracteres. Evite senhas comuns.</p></div>
    <div className="space-y-2"><Label htmlFor="confirmar-senha">Confirmar nova senha</Label><Input id="confirmar-senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmacao} onChange={e=>setConfirmacao(e.target.value)}/></div>
    <Button type="submit" disabled={busy} className="w-full">{busy?'Salvando...':'Salvar nova senha'}</Button>
   </form>}
   {erro&&<p role="alert" className="text-sm text-red-700">{erro}</p>}
   {!sucesso&&<Link className="block text-sm text-blue-700 underline" href="/forgot-password">Solicitar novo link</Link>}
   <Link className="block text-sm text-blue-700 underline" href="/login">Voltar para entrar</Link>
  </CardContent>
 </Card></main>
}
