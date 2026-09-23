'use client'
import {useState} from 'react'
import {ErroPortal,mensagemPortal,portalApi} from '@/lib/portal-api'
const endpoint=(tipo:string)=>tipo==='associado'?'/api/associado-app/notificacoes':'/api/associados/notificacoes'
export async function desligarPush(tipo:string){
 if(!('serviceWorker' in navigator))return
 const reg=await navigator.serviceWorker.getRegistration('/associado/'),sub=await reg?.pushManager.getSubscription()
 if(sub){await portalApi(endpoint(tipo),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint})});await sub.unsubscribe()}
}
export function NotificacoesClube({tipo}:{tipo:'associado'|'equipe'}){
 const [aviso,setAviso]=useState(''),[busy,setBusy]=useState(false)
 async function ativar(){
  setBusy(true);setAviso('')
  try{
   if(!window.isSecureContext||!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new ErroPortal('Este navegador não oferece notificações. As mensagens continuam disponíveis aqui.')
   const perm=await Notification.requestPermission()
   if(perm!=='granted')throw new ErroPortal('Notificações não autorizadas. Você pode permitir nas configurações deste site.')
   const j=await portalApi(endpoint(tipo))
   const reg=await navigator.serviceWorker.register('/associado/notificacoes-sw.js',{scope:'/associado/'})
   if(!reg.active)await new Promise<void>((resolve,reject)=>{const sw=reg.installing||reg.waiting;if(!sw)return resolve();const t=setTimeout(()=>reject(new ErroPortal('A ativação demorou. Tente novamente.')),15000);sw.addEventListener('statechange',()=>{if(sw.state==='activated'){clearTimeout(t);resolve()}else if(sw.state==='redundant'){clearTimeout(t);reject(new ErroPortal('Não foi possível ativar.'))}})})
   const b64=j.publicKey.replace(/-/g,'+').replace(/_/g,'/'),key=Uint8Array.from(atob(b64+'='.repeat((4-b64.length%4)%4)),c=>c.charCodeAt(0))
   const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key})
   await portalApi(endpoint(tipo),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())})
   setAviso('Notificações ativadas neste dispositivo. A entrega depende das permissões e das configurações de bateria do navegador.')
  }catch(e:any){setAviso(mensagemPortal(e))}finally{setBusy(false)}
 }
 return <section className="clube-push" aria-label="Notificações do dispositivo"><div className="clube-msg-actions"><button disabled={busy} onClick={ativar}>Ativar notificações neste dispositivo</button><button disabled={busy} onClick={async()=>{setBusy(true);try{await desligarPush(tipo);setAviso('Notificações desativadas neste dispositivo.')}catch(e:any){setAviso(mensagemPortal(e))}finally{setBusy(false)}}}>Desativar</button></div><p role="status">{aviso||'Receba um aviso de nova mensagem mesmo com esta página fechada.'}</p></section>
}
