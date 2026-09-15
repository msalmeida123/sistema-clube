'use client'
import {useEffect,useRef,useState} from 'react'
import {Button} from '@/components/ui/button'
export async function enviarUSBLocal(pedidoId:string,destino:string,reimpressao=false){
 const r=await fetch('/api/bar/imprimir-venda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pedido_id:pedidoId,destino,reimpressao})});const d=await r.json();if(!r.ok)throw Error(d.error);return d.mensagem
}
export function BotaoUSBLocal({pedidoId,destino,reimpressao=false}:{pedidoId:string;destino:'cozinha'|'balcao';reimpressao?:boolean}){
 const [msg,setMsg]=useState(''),[busy,setBusy]=useState(false);const trava=useRef(false)
 async function imprimir(){if(trava.current)return;if(reimpressao&&!confirm('Confira a impressora antes de emitir outra via. Continuar?'))return;trava.current=true;setBusy(true);try{setMsg(await enviarUSBLocal(pedidoId,destino,reimpressao))}catch(e:any){setMsg(e.message)}finally{trava.current=false;setBusy(false)}}
 return <div><Button type="button" variant="outline" disabled={busy} onClick={imprimir}>{busy?'Enviando...':`${reimpressao?'Reimprimir':'Imprimir'} ${destino==='balcao'?'comprovante USB direto':'cozinha'}`}</Button><p role="status" className="text-sm">{msg}</p></div>
}
export function ImpressaoAutomaticaVenda({pedidoId}:{pedidoId:string}){
 const [msg,setMsg]=useState('Registrando impressão automática...')
 useEffect(()=>{enviarUSBLocal(pedidoId,'automatico').then(setMsg).catch(e=>setMsg('Venda salva. '+e.message))},[pedidoId])
 return <p role="status" className="text-sm">{msg}</p>
}
