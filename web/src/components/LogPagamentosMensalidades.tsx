'use client'
import {useState} from 'react'
import {createClientComponentClient} from '@/lib/supabase/client'
import {Button} from '@/components/ui/button'
import {toast} from 'sonner'
export default function LogPagamentosMensalidades(){
 const [rows,setRows]=useState<any[]>([]),[aberto,setAberto]=useState(false)
 async function carregar(){const {data,error}=await createClientComponentClient().from('pagamentos_mensalidade_log').select('*').order('data_hora',{ascending:false}).limit(50);if(error){toast.error('Não foi possível consultar o log de pagamentos.');return}setRows(data||[]);setAberto(true)}
 return <div className="space-y-3"><Button variant="outline" onClick={carregar}>Log de pagamentos na maquininha</Button>{aberto&&<div className="overflow-auto border rounded bg-white p-3"><p className="mb-2">Últimos 50 pagamentos</p><table className="w-full text-sm"><thead><tr>{['Data','Atendente','Destino','Valor','Forma','Operadora / NSU','Mensalidade'].map(t=><th key={t} className="p-2 text-left">{t}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td className="p-2">{new Date(r.data_hora).toLocaleString('pt-BR')}</td><td>{r.operador_nome||r.operador_id}</td><td>{r.tipo}</td><td>{Number(r.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td>{r.forma}</td><td>{r.operadora} / {r.nsu}</td><td>{r.mensalidade_id}</td></tr>)}</tbody></table>{!rows.length&&<p>Nenhum pagamento registrado.</p>}</div>}</div>
}
