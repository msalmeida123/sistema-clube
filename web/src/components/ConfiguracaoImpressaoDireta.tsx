'use client'
import {useEffect,useState} from 'react'
import {Button} from '@/components/ui/button'
export default function ConfiguracaoImpressaoDireta(){
 const [c,setC]=useState<any>(null),[fila,setFila]=useState<any[]>([]),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 async function carregar(){try{const r=await fetch('/api/bar/impressao-local');const d=await r.json();if(!r.ok)throw Error(d.error);setC(d.config);setFila(d.fila);if(!d.config)setMsg('O agente ainda não foi instalado.')}catch(e:any){setMsg(e.message)}}
 useEffect(()=>{carregar()},[])
 async function salvar(){setBusy(true);try{const r=await fetch('/api/bar/impressao-local',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)});const d=await r.json();if(!r.ok)throw Error(d.error);setMsg('Impressoras e papel salvos. A impressão direta não abre janelas.')}catch(e:any){setMsg(e.message)}finally{setBusy(false)}}
 async function teste(destino:string){setBusy(true);try{const r=await fetch('/api/bar/impressao-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teste:true,destino})});const d=await r.json();if(!r.ok)throw Error(d.error);setMsg(d.mensagem)}catch(e:any){setMsg(e.message)}finally{setBusy(false)}}
 const nomes:Record<string,string>={pendente:'Aguardando agente',processando:'Enviando',enviado:'Enviado à fila do Windows',incerto:'Conferir impressora'}
 return <section className="border rounded-xl bg-white p-6 space-y-4"><h2 className="text-xl font-bold">USB automática — cozinha e balcão</h2><p>O agente reconhece as impressoras USB do Windows. Escolha os destinos e o papel uma vez. O computador deve estar ligado e com o agente em execução.</p>
 <Button variant="outline" disabled={busy} onClick={carregar}>Atualizar impressoras e fila</Button>
 {c&&<fieldset disabled={busy} className="space-y-4"><p>Agente: {c.ultima_conexao&&Date.now()-Date.parse(c.ultima_conexao)<60000?'conectado':'sem conexão recente'}</p>
 {(['cozinha','balcao'] as const).map(d=><label className="block" key={d}>Impressora {d==='cozinha'?'da cozinha':'do balcão'}<select className="block border rounded p-2 w-full" value={c[d]} onChange={e=>setC({...c,[d]:e.target.value})}><option value="">Não imprimir neste destino</option>{(c.impressoras||[]).map((p:any)=><option key={p.nome} value={p.nome}>{p.nome} ({p.porta})</option>)}</select></label>)}
 <label className="block">Papel<select className="block border rounded p-2" value={c.papel} onChange={e=>setC({...c,papel:Number(e.target.value)})}><option value={80}>80 mm</option><option value={58}>58 mm</option></select></label>
 <label className="block">Modo<select className="block border rounded p-2" value={c.protocolo} onChange={e=>setC({...c,protocolo:e.target.value})}><option value="escpos">ESC/POS</option><option value="texto">Texto simples</option></select></label>
 <label className="flex gap-2"><input type="checkbox" checked={c.cortar} onChange={e=>setC({...c,cortar:e.target.checked})}/>Cortar papel ao terminar (ESC/POS)</label>
 <label className="flex gap-2"><input type="checkbox" checked={c.automatico} onChange={e=>setC({...c,automatico:e.target.checked})}/>Imprimir automaticamente ao finalizar a venda</label>
 <Button onClick={salvar}>Salvar impressão automática</Button><p className="text-sm">Salve antes de testar. Enviado ao Windows não confirma saída do papel; confira antes de repetir.</p>
 <div className="flex gap-2"><Button variant="outline" onClick={()=>teste('cozinha')}>Teste cozinha</Button><Button variant="outline" onClick={()=>teste('balcao')}>Teste balcão</Button></div></fieldset>}
 <p role="status">{msg}</p><h3 className="font-semibold">Últimas impressões</h3><ul>{fila.map(j=><li className="border-b py-2 text-sm" key={j.id}>{new Date(j.criado_em).toLocaleString('pt-BR')} — {j.destino} — {nomes[j.status]}{j.erro?' — '+j.erro:''}</li>)}</ul>
 </section>
}
